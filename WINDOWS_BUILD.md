# Amber Music Platform - Windows Desktop Build

## Building for Windows Desktop (PLAN B)

This project can run both as a web application and as a native Windows desktop app using Tauri.

### Prerequisites for Windows Build

1. **Node.js** (LTS version recommended)
2. **Rust toolchain** - Required for Tauri
3. **Visual Studio Build Tools** (for native compilation)

### Step-by-Step Build Instructions

#### 1. Install Rust (required for Tauri)

Open PowerShell as Administrator and run:

```powershell
# Install Rust toolchain
rustup toolchain install stable
rustup default stable

# Verify installation
rustc --version
cargo --version
```

If you don't have rustup, download from: https://rustup.rs/

#### 2. Install Tauri CLI

```bash
cargo install tauri-cli
```

#### 3. Install Windows Build Dependencies

```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Or download from: https://visualstudio.microsoft.com/downloads/
```

#### 4. Build the Web Application

```bash
npm install
npm run build
```

#### 5. Build the Windows Desktop App

```bash
# Set environment for production build
$env:TAURI_BUILD_PATH = "http://localhost:3000"

# Build for Windows
npx tauri build --target x86_64-pc-windows-msvc
```

#### 6. Alternative: Dev Mode

For development with hot reload:

```bash
npx tauri dev
```

### Output Location

After building, you'll find the Windows installer in:
```
src-tauri/target/release/bundle/msi/
```

### Configuration

Edit `tauri.conf.json` to customize:
- Window size and properties
- App icons
- Permissions
- Build settings

### Running Both Modes

- **Web mode**: `npm run dev` or `npm start`
- **Desktop mode**: `npm run tauri:dev` or `npm run tauri:build:win`

### Troubleshooting

1. **Rust not found**: Ensure Rust is in your PATH
2. **Build tools missing**: Install Visual Studio Build Tools
3. **API errors**: Check your .env.local file has all required keys
4. **Port issues**: The dev server runs on port 3000

### App Features

When running as Windows desktop app:
- Native window controls
- System tray integration
- Offline support
- Native file system access
- Better performance than web version

### Next Steps

1. Set your preferred icons in `src-tauri/icons/`
2. Customize the app updater settings in `tauri.conf.json`
3. Test the app in dev mode before building production