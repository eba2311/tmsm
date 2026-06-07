@echo off
color 0B
echo ==========================================
echo Starting TMSM System (Fresh Start)...
echo ==========================================

cd /d "c:\Users\hp\Desktop\tmsm"

echo [1/3] Stopping any stuck background processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server...
start "TMSM Backend" cmd /k "cd /d c:\Users\hp\Desktop\tmsm\server && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Application...
start "TMSM Frontend" cmd /k "cd /d c:\Users\hp\Desktop\tmsm\client && npm run dev"

echo.
echo ==========================================
echo DONE! 
echo Two new terminal windows should have opened.
echo If they are running without crashing, open your browser to:
echo http://localhost:5177
echo ==========================================
pause
