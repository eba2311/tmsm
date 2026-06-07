@echo off
color 0A
echo ==========================================
echo  TMSM - Fix Driver Document Upload Issue
echo ==========================================
echo.

echo [1/3] Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done.

echo [2/3] Ensuring drivers exist for document upload...
node server/scripts/ensure-drivers-exist.js
timeout /t 3 /nobreak >nul
echo   Done.

echo [3/3] Starting system with fixed driver document upload...
start "TMSM Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo  ✅ Driver Document Upload Issue Fixed!
echo  
echo  ISSUE RESOLVED:
echo  • Fixed "driverId cannot be null" error
echo  • Enhanced driver selection handling
echo  • Added proper driver lookup by license number
echo  • Improved error messages and validation
echo  
echo  HOW TO TEST:
echo  1. Go to Driver Compliance section
echo  2. Click "Upload Driver Document" 
echo  3. Select a driver from dropdown
echo  4. Fill in document details
echo  5. Upload file and submit
echo  
echo  The system now properly:
echo  • Handles driver selection format
echo  • Validates all required fields
echo  • Creates documents with correct driver IDs
echo  • Provides clear error messages
echo ==========================================
echo.
pause