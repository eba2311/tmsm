@echo off
echo Seeding the TMSM Database with Demo Data...
echo This will create Routes, Vehicles, Drivers, and Schedules for testing the Booking Engine.
node server/scripts/seed.js
echo.
echo Seeding Complete! You can now test the 5-step Booking flow.
pause
