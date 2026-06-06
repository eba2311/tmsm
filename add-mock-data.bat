@echo off
echo ==========================================
echo  INJECTING MOCK DATA INTO LIVE DATABASE
echo ==========================================
echo.

cd /d "%~dp0server"
echo Running from: %CD%
echo.
node scripts/mock-data.js

echo.
echo ==========================================
echo  Done! Check above for results.
echo ==========================================
pause
