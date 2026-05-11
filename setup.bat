@echo off
echo ===== Fiver Star Water Filter Plant - Setup =====

echo.
echo [1/4] Setting up Backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo [2/4] Configuring Backend...
if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example - please edit it with your DB credentials
)

echo.
echo [3/4] Setting up Frontend...
cd ..\frontend
npm install

echo.
echo [4/4] Done!
echo.
echo Next Steps:
echo   1. Edit backend\.env with your PostgreSQL credentials
echo   2. Create database: psql -c "CREATE DATABASE water_filter_db;"
echo   3. Run migrations: cd backend && python manage.py migrate
echo   4. Seed data: cd backend && python seed_data.py
echo   5. Start backend: cd backend && python manage.py runserver
echo   6. Start frontend: cd frontend && npm run dev
echo.
echo Access: http://localhost:3000
pause
