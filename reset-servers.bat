@echo off
echo ==========================================
echo Force Restarting Node Servers...
echo ==========================================
echo Stopping all running background tasks that are stuck...
taskkill /F /IM node.exe
timeout /t 2 /nobreak >nul
echo.
echo Background servers have been stopped successfully.
echo Now starting fresh servers...
echo.
start "" "run-local.bat"
echo Restart initiated! Please check the new console windows.
pause
