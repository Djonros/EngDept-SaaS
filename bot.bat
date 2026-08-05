@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Telegram Bot

echo ============================================================================
echo   EngDept SaaS - Telegram Bot (Long Polling)
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo Checking configuration...

if not exist ".env.local" (
    echo   ERROR: .env.local not found!
    echo   Run setup.bat first.
    pause
    exit /b 1
)

findstr /c:"TELEGRAM_BOT_TOKEN=" .env.local | findstr /v "^#" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: TELEGRAM_BOT_TOKEN not set in .env.local!
    echo   Get a token from @BotFather in Telegram.
    pause
    exit /b 1
)

echo   Configuration OK.
echo.
echo Starting Telegram bot in long-polling mode...
echo   Commands: /start  /tasks  /balance  /link email  /help
echo.
echo Press Ctrl+C to stop.
echo ----------------------------------------------------------------------------

npm run bot

pause
