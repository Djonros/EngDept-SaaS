@echo off
chcp 65001 >nul 2>&1
title EngDept SaaS - Database Setup

echo ============================================================================
echo   EngDept SaaS - Database Migration
echo   Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
echo ============================================================================

echo.
echo This script applies SQL migrations to your Supabase database.
echo.
echo Prerequisites:
echo   1. .env.local must contain NEXT_PUBLIC_SUPABASE_URL
echo   2. Supabase CLI must be installed (npm install -g supabase)
echo.

echo Checking .env.local...
if not exist ".env.local" (
    echo   ERROR: .env.local not found!
    echo   Run setup.bat first.
    pause
    exit /b 1
)

echo.
echo Available migrations:
echo   [1] 0001_init.sql        - All tables, RLS, RPC, triggers
echo   [2] 0002_add_paid_at.sql - Add paid_at column to tasks
echo   [3] Run all migrations
echo.

set /p choice="Select migration (1/2/3): "

if "%choice%"=="1" goto run_0001
if "%choice%"=="2" goto run_0002
if "%choice%"=="3" goto run_all

echo Invalid choice.
pause
exit /b 1

:run_0001
echo.
echo Applying 0001_init.sql...
echo ============================================================================\
type "supabase\migrations\0001_init.sql" | findstr /v "^$"
echo.
echo IMPORTANT: Copy the SQL above and run it in Supabase SQL Editor.
echo Or use Supabase CLI: supabase db push
echo.
goto done

:run_0002
echo.
echo Applying 0002_add_paid_at.sql...
echo ============================================================================
type "supabase\migrations\0002_add_paid_at.sql" | findstr /v "^$"
echo.
echo IMPORTANT: Copy the SQL above and run it in Supabase SQL Editor.
echo.
goto done

:run_all
echo.
echo Migration 1 of 2: 0001_init.sql
echo ============================================================================
type "supabase\migrations\0001_init.sql"
echo.
echo ============================================================================
echo Migration 2 of 2: 0002_add_paid_at.sql
echo ============================================================================
type "supabase\migrations\0002_add_paid_at.sql"
echo.
echo IMPORTANT: Copy the SQL above and run all of it in Supabase SQL Editor.
echo.

:done
echo ============================================================================
echo   Database migration content displayed above.
echo   Paste it into Supabase Dashboard -> SQL Editor and click Run.
echo ============================================================================
pause
