@echo off
title TMSM - Arba Minch Transport System
color 0A
echo.
echo  ==========================================
echo   TMSM - Arba Minch Transport System
echo   Starting Server and Client...
echo  ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking server dependencies...
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server && npm install && cd ..
)

echo [2/4] Checking client dependencies...
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client && npm install && cd ..
)

echo [3/4] Starting BACKEND on http://localhost:4002 ...
start "TMSM Backend" cmd /k "cd /d %~dp0server && set PORT=4002 && npm run dev > backend.log 2>&1"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [4/4] Starting FRONTEND on http://localhost:5177 ...
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo   SYSTEM IS STARTING!
echo   Open browser: http://localhost:5177
echo.
echo   Admin Email   : admin@semenconnect.com
echo   Admin Password: Admin@1234
echo  ==========================================
echo.
pause
