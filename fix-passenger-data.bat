@echo off
color 0A
echo ==========================================
echo  TMSM - Fixing Passenger Data Issues
echo ==========================================
echo.

echo [1/4] Stopping all processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.

echo [2/4] Enabling schema sync temporarily...
powershell -Command "(Get-Content 'server\src\config\database.js') -replace 'await sequelize.sync\(\);', 'await sequelize.sync({ alter: true });' | Set-Content 'server\src\config\database.js'"
echo   Done.

echo [3/4] Starting server to sync database schema...
start "Schema Sync" cmd /c "cd /d %~dp0server && node src/index.js && pause"
echo   Waiting for schema sync...
timeout /t 8 /nobreak >nul

echo [4/4] Restoring safe sync mode...
powershell -Command "(Get-Content 'server\src\config\database.js') -replace 'await sequelize.sync\(\{ alter: true \}\);', 'await sequelize.sync();' | Set-Content 'server\src\config\database.js'"
echo   Done.

echo.
echo ==========================================
echo  Schema updated! Now starting system...
echo ==========================================

taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 5 /nobreak >nul
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ✅ System started with updated passenger fields!
echo Open your browser to: http://localhost:5177
echo.
pause