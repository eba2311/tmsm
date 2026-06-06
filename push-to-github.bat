@echo off
echo ==========================================
echo  PUSHING ALL FIXES TO GITHUB
echo ==========================================
echo.
cd /d "%~dp0"
echo Step 1: Adding all files...
git add .
echo.
echo Step 2: Committing all fixes...
git commit -m "fix: rate limit raised, driver creation allowed for agents, trust proxy for Render, frontend error display"
echo.
echo Step 3: Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo Trying master branch...
    git push origin master
)
echo.
echo ==========================================
echo  DONE! Render will now auto-deploy.
echo  Wait 3-4 minutes then test your site!
echo ==========================================
pause
