@echo off
echo ==========================================
echo  Restarting TMSM with Updated Passenger Data
echo ==========================================

echo [1/3] Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Seeding passenger data...
cd server
node scripts/seed-passengers.js
timeout /t 3 /nobreak >nul
cd ..

echo [3/3] Starting system...
start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 5 /nobreak >nul
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ✅ System restarted with updated passenger data!
echo Open your browser to: http://localhost:5177
echo.
pause