@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Dev Server

echo ============================================================================
echo   EngDept SaaS - Development Server
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo Checking .env.local...
if not exist ".env.local" (
    echo   ERROR: .env.local not found!
    echo   Run setup.bat first.
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo   URL: http://localhost:3000
echo.
echo Press Ctrl+C to stop.
echo ----------------------------------------------------------------------------

npm run dev

pause
