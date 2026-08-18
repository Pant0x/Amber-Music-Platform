#!/bin/bash

# Tauri Desktop App Setup for Amber Music Platform
# Run this script to prepare your Windows build

echo "🔧 Setting up Tauri Desktop App..."

# Install Tauri CLI globally
cargo install tauri-cli

# Create Tauri directories
mkdir -p src-tauri/icons

# Download placeholder icons (or use your own)
echo "📥 Downloading placeholder icons..."
curl -o src-tauri/icons/128x128.png "https://img.icons8.com/fluency/128/headphones.png"
curl -o src-tauri/icons/192x192.png "https://img.icons8.com/fluency/192/headphones.png"
curl -o src-tauri/icons/256x256.png "https://img.icons8.com/fluency/256/headphones.png"
curl -o src-tauri/icons/384x384.png "https://img.icons8.com/fluency/384/headphones.png"
curl -o src-tauri/icons/512x512.png "https://img.icons8.com/fluency/512/headphones.png"
curl -o src-tauri/icons/32x32.png "https://img.icons8.com/fluency/32/headphones.png"
curl -o src-tauri/icons/16x16.png "https://img.icons8.com/fluency/16/headphones.png"

# Create icons directory structure
mkdir -p src-tauri/icons/128x128
mkdir -p src-tauri/icons/256x256

echo "✅ Tauri setup complete!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npx tauri build --target x86_64-pc-windows-msvc"