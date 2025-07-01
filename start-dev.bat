@echo off
echo Starting Campus RideShare Development Environment...
echo.

echo [1/3] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

echo [2/3] Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend Development Server...
cd campus-ride-share
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Development environment started!
echo 📱 Frontend: http://localhost:5173
echo 🚀 Backend: http://localhost:5000
echo.
echo Press any key to continue...
pause > nul
