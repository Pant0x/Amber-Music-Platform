@echo off
title Amber Music Platform - Setup
color 0A
cls
echo ========================================
echo   Amber Music Platform Installer
echo ========================================
echo.

cd /d "D:\Programming\Projects\Amber-Music-Platform"

echo [1/4] Checking build...
if exist ".next\server.js" (
    echo ✅ Build found!
) else (
    echo ⚠️  Build not found, building now...
    npm run build
)

echo.
echo [2/4] Installing Electron...
if not exist "node_modules\electron" (
    npm install --save-dev electron
)

echo [3/4] Creating desktop app...
echo.
echo [4/4] Running desktop app...
echo.
echo 🎵 Your Amber Music Platform is launching!
echo.

npm run desktop 2>nul || npm start

pause