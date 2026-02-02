@echo off
REM Production Deployment Script for Raphael's Horizon (Windows)
REM This script handles the complete deployment process

echo 🚀 Starting Raphael's Horizon Production Deployment

REM Colors for output (Windows CMD)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Check if required tools are installed
:check_dependencies
call :print_status "Checking dependencies..."

where node >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "npm is not installed. Please install npm first."
    exit /b 1
)

call :print_success "Dependencies check passed"
goto :eof

REM Install dependencies
:install_dependencies
call :print_status "Installing dependencies..."

REM Install root dependencies
call npm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install root dependencies"
    exit /b 1
)

REM Install backend dependencies
cd backend
call npm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install backend dependencies"
    exit /b 1
)
cd ..

REM Install frontend dependencies
cd frontend
if exist package.json (
    call npm install
    if %errorlevel% neq 0 (
        call :print_error "Failed to install frontend dependencies"
        exit /b 1
    )
)
cd ..

call :print_success "Dependencies installed"
goto :eof

REM Build frontend
:build_frontend
call :print_status "Building frontend..."

cd frontend
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        call :print_error "Failed to build frontend"
        exit /b 1
    )
)
cd ..

call :print_success "Frontend built"
goto :eof

REM Sync frontend to public
:sync_public
call :print_status "Syncing frontend to public folder..."

if exist "public" (
    call :print_status "Cleaning public folder to ensure exact sync..."
    rmdir /s /q "public"
)
if not exist "public" mkdir "public"

REM Use Robocopy to exclude node_modules and .git
robocopy "frontend" "public" /E /XD node_modules .git /NFL /NDL /NJH /NJS /nc /ns /np
REM Robocopy returns success codes 0-7. Error is 8+.
if %errorlevel% gtr 7 (
    call :print_error "Failed to sync frontend to public"
    exit /b 1
)

call :print_success "Frontend synced to public"
goto :eof

REM Sync public to frontend (Restore)
:sync_public_to_frontend
call :print_status "Syncing public to frontend folder..."
if not exist "frontend" mkdir "frontend"
xcopy "public\*" "frontend\" /E /I /H /Y /Q
call :print_success "Public synced to frontend"
goto :eof

REM Run tests
:run_tests
call :print_status "Running tests..."

cd backend
call npm test
if %errorlevel% neq 0 (
    call :print_warning "Tests failed, but continuing deployment"
)
cd ..

call :print_success "Tests completed"
goto :eof

REM Deploy to Netlify
:deploy_netlify
call :print_status "Deploying to Netlify..."

where netlify >nul 2>nul
if %errorlevel% neq 0 (
    call :print_warning "Netlify CLI not found. Installing..."
    call npm install -g netlify-cli
)

REM Deploy frontend to Netlify
call netlify deploy --prod --dir=frontend

call :print_success "Deployed to Netlify"
goto :eof

REM Deploy to Vercel
:deploy_vercel
call :print_status "Deploying to Vercel..."

set "FORCE_FLAG="
if "%~1"=="--force" set "FORCE_FLAG=--force"

where vercel >nul 2>nul
if %errorlevel% neq 0 (
    call :print_warning "Vercel CLI not found. Installing..."
    call npm install -g vercel
)

REM Reminder for Git users
if exist ".git" (
    call :print_status "Ensure you have committed your changes (including 'frontend' folder) before deploying via Git!"
    echo.
)

REM Deploy root (uses vercel.json for config)
call vercel deploy --prod %FORCE_FLAG%

call :print_success "Deployed to Vercel"
goto :eof

REM Main deployment function
:main
echo 🎯 Raphael's Horizon Production Deployment
echo ========================================

echo 1. Deploy to Netlify (Frontend)
echo 2. Deploy to Vercel (Frontend)
echo 3. Force Fresh Redeploy to Vercel (Clears Cache)
echo.
set /p choice="Choose option (1-4): "

if "%choice%"=="1" (
    call :check_dependencies
    call :deploy_netlify
) else if "%choice%"=="2" (
    call :check_dependencies
    call :deploy_vercel
) else if "%choice%"=="3" (
    call :check_dependencies
    call :deploy_vercel --force
) else (
    call :print_error "Invalid option."
    exit /b 1
)

call :print_success "🎉 Deployment completed successfully!"
echo.
echo Next steps:
echo 1. Update DNS records to point to your deployment URLs
echo 2. Configure SSL certificates
echo 3. Set up monitoring and analytics
echo 4. Test all functionality in production
echo 5. Set up automated backups

goto :eof

REM Run main function
call :main %*