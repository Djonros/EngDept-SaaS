@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Production Build

echo ============================================================================
echo   EngDept SaaS - Production Build
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo [1/3] Running ESLint...
call npm run lint
if %errorlevel% neq 0 (
    echo.
    echo   ERROR: Linting failed! Fix errors above.
    pause
    exit /b 1
)
echo   Lint passed.

echo.
echo [2/3] Type checking...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo   ERROR: Type checking failed! Fix errors above.
    pause
    exit /b 1
)
echo   Types OK.

echo.
echo [3/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo   ERROR: Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   Build successful!
echo   Output: .next/
echo   Run start.bat to launch the production server.
echo ============================================================================
pause
