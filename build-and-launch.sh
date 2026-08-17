#!/usr/bin/env bash
# Automated Tauri Build and Launch Script
# Save this as build-and-launch.sh (or run.bat on Windows)

set -e

echo "🚀 Building Amber Music Platform - Windows Desktop Version"
echo "============================================================"

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "❌ Rust/Cargo is required but not installed."; exit 1; }
command -v tauri >/dev/null 2>&1 || cargo install tauri-cli >/dev/null 2>&1
echo "✅ Prerequisites check passed"

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 3: Build the web application
echo "🔨 Building web application..."
npm run build

# Step 4: Build Tauri app
echo "🏗️  Building Tauri desktop app..."
npx tauri build --target x86_64-pc-windows-msvc

# Step 5: Find the built executable
echo "🔍 Locating built files..."
DIST_DIR="src-tauri/target/release/bundle/msi"
if [ -d "$DIST_DIR" ]; then
    echo "✅ Build successful! Output files:"
    ls -la "$DIST_DIR"
    
    # Copy to root for easy access
    cp "$DIST_DIR"/*.msi . 2>/dev/null || true
    
    echo ""
    echo "🎉 Build complete! You can find:"
    echo "   - .msi installer in: $DIST_DIR"
    echo "   - Copy in: current directory"
else
    echo "❌ Build output not found in $DIST_DIR"
    exit 1
fi

# Step 6: Optional - Auto-launch (if on Windows with proper setup)
echo ""
read -p "🚀 Launch the built app? (y/n): " launch
if [[ $launch == "y" || $launch == "Y" ]]; then
    if [ -d "$DIST_DIR" ]; then
        echo "Launching app..."
        # On Windows, you would run: start "" "$DIST_DIR/app.msi"
        open "$DIST_DIR" # macOS/Linux
    fi
fi

echo ""
echo "✅ All done! Install the .msi file to get the Windows desktop app"
echo "📦 The app will be at: $DIST_DIR"