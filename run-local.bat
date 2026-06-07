@echo off
title TMSM - Arba Minch Transport System
color 0A
echo.
echo  ==========================================
echo   TMSM - Arba Minch Transport System
echo   Starting all services...
echo  ==========================================
echo.

cd /d "%~dp0"

echo [STEP 1] Killing any stuck Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.

echo [STEP 2] Checking server dependencies...
if not exist "server\node_modules" (
    echo   Installing server dependencies...
    cd server && npm install && cd ..
)

echo [STEP 3] Checking client dependencies...
if not exist "client\node_modules" (
    echo   Installing client dependencies...
    cd client && npm install && cd ..
)

echo [STEP 4] Starting BACKEND on port 4002...
start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo   Waiting 5 seconds for backend to boot...
timeout /t 5 /nobreak >nul

echo [STEP 5] Starting FRONTEND on port 5177...
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo   SYSTEM IS STARTING!
echo.
echo   Open your browser to:
echo   http://localhost:5177
echo.
echo   Admin Email   : admin@semenconnect.com
echo   Admin Password: Admin@1234
echo  ==========================================
echo.
pause
