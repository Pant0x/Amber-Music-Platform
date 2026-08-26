@echo off
title Amber Music Platform
color 0A
cls
echo ========================================
echo   Amber Music Platform - Desktop Mode
echo ========================================
echo.
echo Starting your music platform...
echo.
echo Opening: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

cd /d "D:\Programming\Projects\Amber-Music-Platform"

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Start the app
npm start

pause