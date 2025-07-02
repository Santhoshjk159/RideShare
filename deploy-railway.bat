@echo off
REM CampusCruze Railway Deployment Script for Windows
echo 🚂 Starting CampusCruze deployment to Railway...

echo 📦 Preparing project for Railway deployment...

REM Check if git is initialized
if not exist .git (
    echo 📝 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: CampusCruze ride share app ready for Railway"
)

echo ✅ Project prepared for Railway deployment!
echo.
echo 📋 Next steps:
echo 1. Push your code to GitHub:
echo    git remote add origin https://github.com/YOUR_USERNAME/campuscruze-rideshare.git
echo    git push -u origin main
echo.
echo 2. Go to Railway.app and sign up with GitHub
echo.
echo 3. Create new project from GitHub repo
echo.
echo 4. Add these services in order:
echo    - MySQL Database
echo    - Backend Service (root: backend)
echo    - Frontend Service (root: campus-ride-share)
echo.
echo 5. Configure environment variables in Railway dashboard
echo.
echo 6. Import database schema using Railway's MySQL client
echo.
echo 📚 For detailed instructions, see RAILWAY-DEPLOYMENT.md
echo.
echo 🎉 Your app will be live at Railway URLs!
pause
