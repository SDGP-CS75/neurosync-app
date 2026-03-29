@echo off
setlocal enabledelayedexpansion

REM NeuroSync Deployment Script for Windows
REM This script helps deploy both backend and frontend

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           NeuroSync Deployment Script                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [✗] Node.js is not installed. Please install Node.js v18 or higher.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [✗] npm is not installed. Please install npm.
    exit /b 1
)

echo [✓] All requirements met!
echo.

REM Main menu
echo What would you like to deploy?
echo 1) Backend only
echo 2) Frontend only
echo 3) Both backend and frontend
set /p main_choice="Enter choice [1-3]: "

if "%main_choice%"=="1" goto :deploy_backend
if "%main_choice%"=="2" goto :deploy_frontend
if "%main_choice%"=="3" goto :deploy_both
echo [✗] Invalid choice
exit /b 1

:deploy_both
call :deploy_backend
call :deploy_frontend
goto :complete

:deploy_backend
echo.
echo [✓] Starting backend deployment...
cd backend

REM Check if .env file exists
if not exist .env (
    echo [!] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [!] Please edit backend\.env with your production values before deploying!
    exit /b 1
)

REM Install dependencies
echo [✓] Installing backend dependencies...
call npm install

REM Platform selection
echo.
echo Select backend deployment platform:
echo 1^) Railway (Recommended^)
echo 2^) Render
echo 3^) Heroku
echo 4^) Skip backend deployment
set /p backend_choice="Enter choice [1-4]: "

if "%backend_choice%"=="1" (
    echo [✓] Deploying to Railway...
    where railway >nul 2>nul
    if %errorlevel% equ 0 (
        railway up
    ) else (
        echo [!] Railway CLI not installed. Install with: npm install -g @railway/cli
        echo [✓] You can also deploy via GitHub at https://railway.app
    )
) else if "%backend_choice%"=="2" (
    echo [✓] Deploying to Render...
    echo [✓] Please connect your GitHub repository at https://render.com
    echo [✓] Set root directory to 'backend' and start command to 'npm start'
) else if "%backend_choice%"=="3" (
    echo [✓] Deploying to Heroku...
    where heroku >nul 2>nul
    if %errorlevel% equ 0 (
        if not exist Procfile (
            echo web: node src/server.js > Procfile
            echo [✓] Created Procfile
        )
        git add Procfile
        git commit -m "Add Procfile for Heroku deployment" 2>nul || echo [✓] No changes to commit
        heroku create neurosync-api 2>nul || echo [✓] App may already exist
        git push heroku main
    ) else (
        echo [!] Heroku CLI not installed. Install with: npm install -g heroku
    )
) else if "%backend_choice%"=="4" (
    echo [✓] Skipping backend deployment
) else (
    echo [✗] Invalid choice
)

cd ..
goto :eof

:deploy_frontend
echo.
echo [✓] Starting frontend deployment...
cd frontend

REM Check if .env file exists
if not exist .env (
    echo [!] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [!] Please edit frontend\.env with your production values before deploying!
    exit /b 1
)

REM Install dependencies
echo [✓] Installing frontend dependencies...
call npm install

REM Platform selection
echo.
echo Select frontend deployment platform:
echo 1^) Mobile App (iOS/Android^) via EAS
echo 2^) Web (Vercel^)
echo 3^) Web (Netlify^)
echo 4^) Web (GitHub Pages^)
echo 5^) Skip frontend deployment
set /p frontend_choice="Enter choice [1-5]: "

if "%frontend_choice%"=="1" (
    echo [✓] Building mobile app...
    where eas >nul 2>nul
    if %errorlevel% equ 0 (
        echo.
        echo Select platform:
        echo 1^) Android
        echo 2^) iOS
        echo 3^) Both
        set /p platform_choice="Enter choice [1-3]: "
        
        if "!platform_choice!"=="1" (
            eas build --platform android --profile production
        ) else if "!platform_choice!"=="2" (
            eas build --platform ios --profile production
        ) else if "!platform_choice!"=="3" (
            eas build --platform all --profile production
        ) else (
            echo [✗] Invalid choice
        )
    ) else (
        echo [!] EAS CLI not installed. Install with: npm install -g eas-cli
        echo [✓] Then run: eas login
    )
) else if "%frontend_choice%"=="2" (
    echo [✓] Deploying to Vercel...
    call npm run build:web
    where vercel >nul 2>nul
    if %errorlevel% equ 0 (
        vercel --prod
    ) else (
        echo [!] Vercel CLI not installed. Install with: npm install -g vercel
        echo [✓] You can also deploy via GitHub at https://vercel.com
    )
) else if "%frontend_choice%"=="3" (
    echo [✓] Deploying to Netlify...
    call npm run build:web
    echo [✓] Please connect your GitHub repository at https://netlify.com
    echo [✓] Set build command to 'npm run build:web' and publish directory to 'web-build'
) else if "%frontend_choice%"=="4" (
    echo [✓] Deploying to GitHub Pages...
    call npm run build:web
    where gh-pages >nul 2>nul
    if %errorlevel% equ 0 (
        npx gh-pages -d web-build
    ) else (
        echo [!] gh-pages not installed. Install with: npm install --save-dev gh-pages
    )
) else if "%frontend_choice%"=="5" (
    echo [✓] Skipping frontend deployment
) else (
    echo [✗] Invalid choice
)

cd ..
goto :eof

:complete
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Deployment Complete!                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [✓] Don't forget to:
echo   1. Update environment variables with production values
echo   2. Update CORS_ORIGIN in backend to match your frontend URL
echo   3. Update EXPO_PUBLIC_API_URL in frontend to match your backend URL
echo   4. Test all features after deployment
echo.
pause
