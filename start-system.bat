@echo off
title START TMSM SYSTEM

echo =======================================
echo Starting Database Backend
echo =======================================
if not exist "server\node_modules" (
    echo Installing backend dependencies...
    cd server && npm install && cd ..
)
start "BACKEND" cmd /k "cd server && npm run dev"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 >nul

echo =======================================
echo Starting React Frontend
echo =======================================
if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    cd client && npm install && cd ..
)
start "FRONTEND" cmd /k "cd client && npm run dev"

echo.
echo =======================================
echo System is starting!
echo Open your browser to: http://localhost:5177
echo =======================================
pause
