#!/usr/bin/env bash
# =============================================================================
# Five Star Water Filter Plant — Ubuntu Server Deploy Script
# Usage:  sudo bash deploy.sh
# =============================================================================
set -euo pipefail

# ── Ports ────────────────────────────────────────────────────────────────────
BE_PORT=9007
FE_PORT=3003

# ── Paths ────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/mnoman786/five_star_water_filter.git"
APP_DIR="/opt/fivestar"
APP_USER="fivestar"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Root check ───────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Run this script as root:  sudo bash deploy.sh"

# =============================================================================
# 1. COLLECT CONFIGURATION
# =============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Five Star Water Filter Plant — Server Setup        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

SERVER_IP="162.217.248.75"

read -rp "Django superuser email [admin@fivestar.com]: " DJANGO_EMAIL
DJANGO_EMAIL="${DJANGO_EMAIL:-admin@fivestar.com}"

read -rsp "Django superuser password: " DJANGO_PASS
echo ""
[[ -z "$DJANGO_PASS" ]] && die "Superuser password cannot be empty."

read -rsp "Django superuser password (confirm): " DJANGO_PASS2
echo ""
[[ "$DJANGO_PASS" != "$DJANGO_PASS2" ]] && die "Passwords do not match."

read -rp "Django superuser full name [Super Admin]: " DJANGO_NAME
DJANGO_NAME="${DJANGO_NAME:-Super Admin}"

# Generate a random secret key
SECRET_KEY=$(python3 -c "import secrets,string; print(''.join(secrets.choice(string.ascii_letters+string.digits+'!@#\$%^&*(-_=+)') for _ in range(64)))")

echo ""
info "Configuration summary:"
echo "  Server IP   : $SERVER_IP"
echo "  Backend     : http://${SERVER_IP}:${BE_PORT}"
echo "  Frontend    : http://${SERVER_IP}:${FE_PORT}"
echo "  App dir     : $APP_DIR"
echo "  App user    : $APP_USER"
echo ""
read -rp "Proceed? [Y/n]: " CONFIRM
[[ "${CONFIRM,,}" == "n" ]] && exit 0

# =============================================================================
# 2. SYSTEM DEPENDENCIES
# =============================================================================
info "Updating package lists..."
apt-get update -qq

info "Installing system packages..."
apt-get install -y -qq \
    git curl wget build-essential \
    python3 python3-pip python3-venv \
    2>/dev/null

# Node.js 20 LTS via NodeSource
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
    info "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs 2>/dev/null
fi

success "System dependencies ready. Node $(node -v), Python $(python3 --version)"

# =============================================================================
# 3. APP USER & DIRECTORY
# =============================================================================
if ! id "$APP_USER" &>/dev/null; then
    info "Creating system user '$APP_USER'..."
    useradd --system --shell /bin/bash --home "$APP_DIR" --create-home "$APP_USER"
fi

# =============================================================================
# 4. CLONE / UPDATE REPOSITORY
# =============================================================================
if [[ -d "$APP_DIR/.git" ]]; then
    info "Repository exists — pulling latest changes..."
    sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
else
    info "Cloning repository into $APP_DIR..."
    rm -rf "$APP_DIR"
    sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

success "Repository ready."

# =============================================================================
# 5. BACKEND SETUP
# =============================================================================
info "Setting up Django backend..."

cd "$APP_DIR/backend"

# Virtual environment
if [[ ! -d venv ]]; then
    sudo -u "$APP_USER" python3 -m venv venv
fi

# Install Python deps
sudo -u "$APP_USER" venv/bin/pip install --quiet --upgrade pip
sudo -u "$APP_USER" venv/bin/pip install --quiet -r requirements.txt

# Write .env
cat > "$APP_DIR/backend/.env" <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${SERVER_IP},127.0.0.1,localhost

USE_SQLITE=True

CORS_ALLOWED_ORIGINS=http://${SERVER_IP}:${FE_PORT}

ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"

# Migrations & static files
sudo -u "$APP_USER" venv/bin/python manage.py migrate --no-input
sudo -u "$APP_USER" venv/bin/python manage.py collectstatic --no-input --clear -v 0

# Create superuser (idempotent)
sudo -u "$APP_USER" venv/bin/python manage.py shell <<PYEOF
from apps.users.models import User
if not User.objects.filter(email='${DJANGO_EMAIL}').exists():
    u = User.objects.create_superuser(
        email='${DJANGO_EMAIL}',
        password='${DJANGO_PASS}',
        full_name='${DJANGO_NAME}',
    )
    u.role = 'super_admin'
    u.save()
    print('Superuser created.')
else:
    print('Superuser already exists — skipped.')
PYEOF

success "Backend ready."

# =============================================================================
# 6. FRONTEND SETUP
# =============================================================================
info "Setting up Next.js frontend..."

cd "$APP_DIR/frontend"

# Write .env.local — frontend talks directly to backend via public IP:port
cat > "$APP_DIR/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:${BE_PORT}/api
NEXT_PUBLIC_WS_URL=ws://${SERVER_IP}:${BE_PORT}
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/frontend/.env.local"
chmod 600 "$APP_DIR/frontend/.env.local"

# Install & build
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build

success "Frontend ready."

# =============================================================================
# 7. SYSTEMD SERVICE — BACKEND (daphne)
# =============================================================================
info "Creating systemd service: fivestar-backend..."

cat > /etc/systemd/system/fivestar-backend.service <<EOF
[Unit]
Description=Five Star Water Filter — Django/Daphne Backend
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${APP_DIR}/backend/venv/bin/daphne \
    -b 0.0.0.0 \
    -p ${BE_PORT} \
    config.asgi:application
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fivestar-backend

[Install]
WantedBy=multi-user.target
EOF

# =============================================================================
# 8. SYSTEMD SERVICE — FRONTEND (Next.js)
# =============================================================================
info "Creating systemd service: fivestar-frontend..."

cat > /etc/systemd/system/fivestar-frontend.service <<EOF
[Unit]
Description=Five Star Water Filter — Next.js Frontend
After=network.target fivestar-backend.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}/frontend
Environment=NODE_ENV=production
Environment=PORT=${FE_PORT}
Environment=HOSTNAME=0.0.0.0
ExecStart=/usr/bin/npm run start -- -p ${FE_PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fivestar-frontend

[Install]
WantedBy=multi-user.target
EOF

# =============================================================================
# 9. OPEN FIREWALL PORTS (ufw)
# =============================================================================
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    info "Opening firewall ports ${BE_PORT} and ${FE_PORT}..."
    ufw allow "${BE_PORT}/tcp" >/dev/null
    ufw allow "${FE_PORT}/tcp" >/dev/null
    success "Firewall ports opened."
else
    warn "ufw not active — make sure ports ${BE_PORT} and ${FE_PORT} are open in your firewall/security group."
fi

# =============================================================================
# 10. ENABLE & START SERVICES
# =============================================================================
info "Enabling and starting services..."

systemctl daemon-reload

systemctl enable  fivestar-backend fivestar-frontend
systemctl restart fivestar-backend
systemctl restart fivestar-frontend

# Brief wait then status check
sleep 3

echo ""
for svc in fivestar-backend fivestar-frontend; do
    if systemctl is-active --quiet "$svc"; then
        success "$svc is running"
    else
        warn "$svc failed to start — check: journalctl -u $svc -n 30"
    fi
done

# =============================================================================
# 11. DONE
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Complete!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Frontend   : ${CYAN}http://${SERVER_IP}:${FE_PORT}${NC}"
echo -e "  Backend API: ${CYAN}http://${SERVER_IP}:${BE_PORT}/api/${NC}"
echo -e "  Django admin: ${CYAN}http://${SERVER_IP}:${BE_PORT}/admin/${NC}"
echo ""
echo -e "  Login with : ${YELLOW}${DJANGO_EMAIL}${NC}"
echo ""
echo "  Useful commands:"
echo "    journalctl -u fivestar-backend  -f   # backend logs"
echo "    journalctl -u fivestar-frontend -f   # frontend logs"
echo "    systemctl restart fivestar-backend   # restart backend"
echo "    systemctl restart fivestar-frontend  # restart frontend"
echo ""
