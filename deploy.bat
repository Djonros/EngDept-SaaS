@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Full Deploy

echo ============================================================================
echo   EngDept SaaS - Full Deployment
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Node.js is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo   Node.js: %%i

echo.
echo [2/5] Checking .env.local...
if not exist ".env.local" (
    echo   ERROR: .env.local not found!
    echo   Run setup.bat first.
    pause
    exit /b 1
)
findstr /c:"YOUR_PROJECT" .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo   WARNING: .env.local contains placeholder values!
    set /p confirm="   Continue anyway? (y/n): "
    if /i not "%confirm%"=="y" (
        echo   Deployment aborted.
        pause
        exit /b 1
    )
)
echo   Environment OK.

echo.
echo [3/5] Installing dependencies (production)...
call npm ci
if %errorlevel% neq 0 (
    echo   npm ci failed, trying npm install...
    call npm install
)
if %errorlevel% neq 0 (
    echo   ERROR: Dependency installation failed!
    pause
    exit /b 1
)
echo   Dependencies installed.

echo.
echo [4/5] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo   ERROR: Build failed!
    pause
    exit /b 1
)
echo   Build successful.

echo.
echo [5/5] Starting production server...
echo ============================================================================
echo   Server starting on http://localhost:3000
echo   Press Ctrl+C to stop.
echo ============================================================================

npm run start

pause
