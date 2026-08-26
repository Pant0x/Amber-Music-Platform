@echo off
REM Automated Tauri Build and Launch Script for Windows
REM Save as build-and-launch.bat

echo ============================================
echo  Amber Music Platform - Windows Desktop Build
echo ============================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is required but not found.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check for Rust/Cargo
where cargo >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Rust is required but not found.
    echo Please install Rust from https://rustup.rs
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Install dependencies
echo 📦 Installing dependencies...
npm ci
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build web app
echo 🔨 Building web application...
npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

REM Build Tauri app
echo 🏗️  Building Tauri desktop application...
npx tauri build --target x86_64-pc-windows-msvc
if %ERRORLEVEL% neq 0 (
    echo ❌ Tauri build failed
    pause
    exit /b 1
)

echo.
echo ✅ BUILD SUCCESSFUL!
echo.

REM Check for output
set "DIST_DIR=src-tauri\target\release\bundle\msi"
if exist "%DIST_DIR%" (
    echo 🔍 Build output:
    dir "%DIST_DIR%"
    echo.
    echo 🎉 Your Windows installer is ready!
    echo 📍 Location: %DIST_DIR%
    echo.
    
    REM Copy to root
    copy "%DIST_DIR%\*.msi" . >nul 2>&1
    echo 📁 Also copied to current directory: *.msi
) else (
    echo ❌ Build output not found
    pause
    exit /b 1
)

echo.
echo Would you like to launch the installer? (y/n)
set /p choice=
if /i "%choice%"=="y" (
    echo 🚀 Launching installer...
    start "" "%DIST_DIR%\*.msi"
)

echo.
echo ✅ Done! Install the .msi file to use Amber Music on Windows.
pause