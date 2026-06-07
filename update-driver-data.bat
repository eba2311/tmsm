@echo off
color 0A
echo ==========================================
echo  TMSM - Updating Driver Information
echo ==========================================
echo.

echo [1/5] Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.

echo [2/5] Seeding route data...
node server/scripts/seed-routes.js
timeout /t 2 /nobreak >nul
echo   Done.

echo [3/5] Seeding driver data...
node server/scripts/seed-drivers.js
timeout /t 3 /nobreak >nul
echo   Done.

echo [4/5] Starting backend server...
start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 5 /nobreak >nul

echo [5/5] Starting frontend...
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ==========================================
echo  ✅ System updated with complete driver data!
echo  
echo  Driver information now includes:
echo  • Phone numbers
echo  • Email addresses  
echo  • License details
echo  • Salary information
echo  • Trip counts and ratings
echo  • Emergency contacts
echo  • Bank account details
echo.
echo  Open your browser to: http://localhost:5177
echo ==========================================
echo.
pause