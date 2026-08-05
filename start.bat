@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Production Server

echo ============================================================================
echo   EngDept SaaS - Production Server
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo Checking build...
if not exist ".next" (
    echo   ERROR: .next/ directory not found!
    echo   Run build.bat first.
    pause
    exit /b 1
)

echo.
echo Starting production server...
echo   URL: http://localhost:3000
echo.
echo Press Ctrl+C to stop.
echo ----------------------------------------------------------------------------

npm run start

pause
