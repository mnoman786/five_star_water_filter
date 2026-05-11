# Fiver Star Water Filter Plant - Management System

A full-stack management system for water filter plant operations built with Django REST Framework and Next.js 15.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (djangorestframework-simplejwt) |
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
fs_water_filter/
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── authentication/     # JWT login/logout/register
│   │   ├── users/              # User management, profiles, activity logs
│   │   ├── orders/             # Order CRUD, status management, settings
│   │   └── dashboard/          # Analytics and report endpoints
│   ├── config/                 # Django project settings & URLs
│   ├── seed_data.py            # Sample data seeder
│   ├── requirements.txt
│   └── .env.example
└── frontend/                   # Next.js App Router
    └── src/
        ├── app/
        │   ├── (auth)/login/       # Login page
        │   └── (dashboard)/        # Protected dashboard layout
        │       ├── super-admin/    # Super Admin pages
        │       ├── admin/          # Admin pages
        │       └── user/           # User pages
        ├── components/
        │   ├── layout/             # Sidebar, Header
        │   ├── dashboard/          # StatsCard, RecentOrders
        │   ├── orders/             # OrderTable, OrderForm, StatusModal
        │   ├── profile/            # ProfilePage
        │   └── ui/                 # Modal, etc.
        ├── lib/                    # API client, utils
        ├── store/                  # Zustand auth store
        └── types/                  # TypeScript types
```

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

---

### Backend Setup

**1. Create and activate virtual environment**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

**4. Create PostgreSQL database**
```sql
CREATE DATABASE water_filter_db;
```

**5. Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

**6. Seed sample data**
```bash
python seed_data.py
```

**7. Start development server**
```bash
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### Frontend Setup

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Configure environment**
```bash
cp .env.example .env.local
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**3. Start development server**
```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@fiverstar.com | superadmin123 |
| Admin | admin1@fiverstar.com | admin123 |
| User | user1@example.com | user123 |

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login → returns JWT tokens + user |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/register/` | Register new user account |
| POST | `/api/auth/token/refresh/` | Refresh access token |

### User Endpoints (Super Admin only for management)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List all users (filterable) |
| POST | `/api/users/` | Create user |
| GET | `/api/users/{id}/` | Get user details |
| PATCH | `/api/users/{id}/` | Update user |
| DELETE | `/api/users/{id}/` | Delete user |
| GET/PATCH | `/api/users/profile/` | Own profile |
| POST | `/api/users/change-password/` | Change password |
| GET | `/api/users/admins/` | List admins only |
| GET | `/api/users/activity-logs/` | Activity logs |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List orders (role-filtered) |
| POST | `/api/orders/` | Create order |
| GET | `/api/orders/{id}/` | Get order |
| PATCH | `/api/orders/{id}/` | Update order |
| DELETE | `/api/orders/{id}/` | Delete order |
| PATCH | `/api/orders/{id}/status/` | Update order status (Admin+) |
| POST | `/api/orders/{id}/cancel/` | Cancel pending order |
| GET/PATCH | `/api/orders/settings/` | Plant settings (Super Admin) |
| GET | `/api/orders/public-settings/` | Public pricing info |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/super-admin/` | Full stats + analytics |
| GET | `/api/dashboard/admin/` | Admin-level stats |
| GET | `/api/dashboard/export/` | Export CSV report |

### Query Parameters for Orders
- `?search=` — search by order ID, customer name, phone
- `?status=pending|processing|out_for_delivery|delivered|cancelled`
- `?order_type=pickup|delivery`
- `?payment_status=unpaid|paid|partial`
- `?page=1` — pagination (10 per page)
- `?created_at__gte=2024-01-01` — date filter

---

## Role Permissions

| Feature | Super Admin | Admin | User |
|---------|-------------|-------|------|
| View earnings/revenue | ✅ | ❌ | ❌ |
| Export reports | ✅ | ❌ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ |
| Create/delete admins | ✅ | ❌ | ❌ |
| Create/delete users | ✅ | ❌ | ❌ |
| View all orders | ✅ | ✅ | ❌ |
| Update order status | ✅ | ✅ | ❌ |
| Create orders | ✅ | ✅ | ✅ |
| View own orders | ✅ | ✅ | ✅ |
| Cancel pending orders | ✅ | ✅ | ✅ |

---

## Deployment

### Backend (Production)
```bash
# Set environment variables
DEBUG=False
SECRET_KEY=<strong-random-key>
ALLOWED_HOSTS=yourdomain.com
DB_NAME=water_filter_db
DB_USER=postgres
DB_PASSWORD=<secure-password>
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Collect static files
python manage.py collectstatic

# Run with gunicorn
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (Production)
```bash
# Set environment variable
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

npm run build
npm start
# or deploy to Vercel
```
