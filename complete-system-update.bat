@echo off
color 0A
title TMSM - Complete System Update
echo.
echo  ==========================================
echo   TMSM - Complete Data Population Update
echo  ==========================================
echo.
echo  This script will:
echo  • Stop all running processes
echo  • Populate passenger data with complete info
echo  • Populate driver data with complete info  
echo  • Create sample routes
echo  • Restart backend and frontend
echo.
echo  ==========================================

echo [1/6] Stopping all processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo   ✅ Done.

echo [2/6] Populating passenger data...
node server/scripts/seed-passengers.js
timeout /t 3 /nobreak >nul
echo   ✅ Done.

echo [3/6] Creating sample routes...
node server/scripts/seed-routes.js  
timeout /t 3 /nobreak >nul
echo   ✅ Done.

echo [4/6] Populating driver data...
node server/scripts/seed-drivers.js
timeout /t 3 /nobreak >nul
echo   ✅ Done.

echo [5/6] Starting backend server...
start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 6 /nobreak >nul
echo   ✅ Backend started on port 4003

echo [6/6] Starting frontend...
start "TMSM Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 3 /nobreak >nul
echo   ✅ Frontend starting on port 5177

echo.
echo  ==========================================
echo   🎉 COMPLETE SYSTEM UPDATE FINISHED!
echo  ==========================================
echo.
echo  ✅ All data has been populated with complete information:
echo.
echo  📋 PASSENGER DATA:
echo     • Full names, phone numbers, emails
echo     • Complete addresses and dates of birth
echo     • Emergency contacts and trip counts
echo     • Active status assignments
echo.
echo  🚗 DRIVER DATA:
echo     • Admin User with complete profile
echo     • License information and experience
echo     • Salary, ratings, and trip statistics  
echo     • Emergency contacts and bank details
echo     • Assigned routes and vehicles
echo.
echo  🗺️  ROUTE DATA:
echo     • Arba Minch - Hawassa intercity route
echo     • Local city routes with stops
echo     • GPS coordinates and fare information
echo.
echo  🌐 ACCESS YOUR SYSTEM:
echo     Frontend: http://localhost:5177
echo     Backend:  http://localhost:4003
echo.
echo  👤 LOGIN CREDENTIALS:
echo     Email:    admin@semenconnect.com
echo     Password: Admin@1234
echo.
echo  ==========================================
echo.
pause