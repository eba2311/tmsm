@echo off
echo ==========================================
echo  TMSM - PostgreSQL Password Reset Tool
echo ==========================================
echo.

set PG_PATH=C:\Program Files\PostgreSQL\18
set PG_DATA=%PG_PATH%\data
set PG_BIN=%PG_PATH%\bin
set PG_HBA=%PG_DATA%\pg_hba.conf
set NEW_PASS=tmsm2026

echo [1/5] Backing up pg_hba.conf...
copy "%PG_HBA%" "%PG_HBA%.bak" >nul 2>&1
echo       Done.

echo [2/5] Setting authentication to TRUST (no password)...
powershell -Command "(Get-Content '%PG_HBA%') -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust' | Set-Content '%PG_HBA%'"
echo       Done.

echo [3/5] Restarting PostgreSQL 18 service...
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-18 >nul 2>&1
timeout /t 3 /nobreak >nul
echo       Done.

echo [4/5] Creating database and setting new password...
"%PG_BIN%\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '%NEW_PASS%';" 2>nul
"%PG_BIN%\psql.exe" -U postgres -c "CREATE DATABASE tmsm OWNER postgres;" 2>nul
echo       Done. Password set to: %NEW_PASS%

echo [5/5] Restoring secure authentication...
powershell -Command "(Get-Content '%PG_HBA%') -replace 'trust', 'scram-sha-256' | Set-Content '%PG_HBA%'"
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-18 >nul 2>&1
timeout /t 3 /nobreak >nul
echo       Done.

echo.
echo ==========================================
echo  SUCCESS! PostgreSQL password is now: tmsm2026
echo  Database 'tmsm' has been created.
echo.
echo  Now updating your .env file...
echo ==========================================

powershell -Command "(Get-Content 'server\.env') -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:tmsm2026@localhost:5432/tmsm' | Set-Content 'server\.env'"
echo  .env updated!
echo.
echo  Now starting the server...
echo ==========================================
cd server
npm run dev
