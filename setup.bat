@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Setup

echo ============================================================================
echo   EngDept SaaS - First-Time Setup
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Node.js is not installed!
    echo   Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   Node.js found: %NODE_VERSION%

echo.
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo   ERROR: npm install failed!
    echo   Try deleting node_modules and running npm install again.
    pause
    exit /b 1
)
echo   Dependencies installed successfully.

echo.
echo [3/4] Creating .env.local...
if exist ".env.local" (
    echo   .env.local already exists - skipping.
) else (
    (
        echo # Supabase
        echo NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
        echo SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
        echo.
        echo # Telegram Bot ^(optional^)
        echo TELEGRAM_BOT_TOKEN=
        echo TELEGRAM_WEBHOOK_SECRET=
        echo.
        echo # Site URL
        echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
        echo.
        echo # License encryption key ^(32+ chars^)
        echo LICENSE_ENCRYPTION_KEY=default-dev-key-change-me-32!
    ) > .env.local
    echo   .env.local created from template.
    echo   IMPORTANT: Edit .env.local with your Supabase credentials!
)

echo.
echo [4/4] Verifying configuration...
findstr /c:"YOUR_PROJECT" .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo   WARNING: .env.local contains placeholder values!
    echo   Edit .env.local and replace YOUR_* with real credentials.
    echo.
    echo   After editing, run: db-setup.bat
    echo   Then run:           dev.bat
) else (
    echo   Configuration looks good.
)

echo.
echo ============================================================================
echo   Setup complete!
echo   Next steps:
echo     1. Edit .env.local with your Supabase credentials
echo     2. Run db-setup.bat to initialize the database
echo     3. Run dev.bat to start development server
echo ============================================================================
pause
