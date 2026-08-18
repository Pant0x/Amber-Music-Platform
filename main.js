"use strict";

const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const net = require("net");

const PROTOCOL = "ambermusic";
const DEFAULT_PORT = 3210;
const PORT_RETRIES = 10;
const DEBUG = process.env.AMBER_DEBUG === "1";

let mainWindow = null;
let serverProc = null;
let windowCreated = false;
let tray = null;
let isQuitting = false;
let activePort = DEFAULT_PORT;
let pendingAuthUrl = null;

// ------------------- Single instance lock -------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const url = extractDeepLink(argv);
    if (url) handleDeepLink(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ------------------- Deep link protocol -------------------
function extractDeepLink(argv) {
  if (!argv || !Array.isArray(argv)) return null;
  return argv.find((a) => typeof a === "string" && a.startsWith(`${PROTOCOL}://`)) || null;
}

function handleDeepLink(url) {
  if (mainWindow && windowCreated) {
    mainWindow.webContents.send("ambermusic:auth-link", url);
  } else {
    pendingAuthUrl = url;
  }
}

function setupIpc() {
  ipcMain.handle("ambermusic:open-external", (_event, url) => {
    if (typeof url === "string" && /^https?:\/\//.test(url)) {
      return shell.openExternal(url);
    }
    return Promise.resolve();
  });
}

function registerProtocol() {
  // Windows: register ambermusic:// as a default protocol client
  if (process.platform !== "win32") return;
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

// ------------------- Env loading -------------------
function loadEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

function getStandaloneDir() {
  // Packaged: copied via extraResources -> resources/standalone
  // Dev: .next/standalone relative to project root
  const packaged = path.join(process.resourcesPath || "", "standalone");
  if (fs.existsSync(packaged) && fs.existsSync(path.join(packaged, "server.js"))) {
    return packaged;
  }
  const dev = path.join(__dirname, ".next", "standalone");
  if (fs.existsSync(dev) && fs.existsSync(path.join(dev, "server.js"))) {
    return dev;
  }
  return null;
}

// ------------------- Port probing -------------------
function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, "localhost");
  });
}

async function findFreePort(start) {
  for (let i = 0; i < PORT_RETRIES; i++) {
    const candidate = start + i;
    if (await isPortFree(candidate)) return candidate;
  }
  return null;
}

function waitForServer(url, timeoutMs, cb) {
  const startedAt = Date.now();
  const tick = () => {
    if (Date.now() - startedAt > timeoutMs) {
      cb(new Error("Server did not start in time"));
      return;
    }
    const req = http.get(url, (res) => {
      res.resume();
      cb(null);
    });
    req.on("error", () => {
      setTimeout(tick, 400);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      setTimeout(tick, 400);
    });
  };
  tick();
}

// ------------------- Auto-update -------------------
function setupAutoUpdater() {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false;
    autoUpdater.on("update-available", (info) => {
      if (!mainWindow) return;
      mainWindow.webContents.send("ambermusic:update-available", info.version);
    });
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 15000);
  } catch (e) {
    // updater unavailable (e.g. dev), ignore
  }
}

// ------------------- Server startup -------------------
async function startServer() {
  const standalone = getStandaloneDir();
  if (!standalone) {
    throw new Error("standalone build not found. Run: npm run build");
  }

  activePort = (await findFreePort(DEFAULT_PORT)) || DEFAULT_PORT;

  // Load .env.local and pass through (server-side secrets needed at runtime).
  // Packaged: secrets are NOT embedded in the asar; the user must place
  // .env.local next to the executable (or set env vars) so keys are never
  // extractable from the distributed binary.
  // Dev: read from the project root as before.
  const isPackaged = !!process.resourcesPath;
  const envPath = isPackaged
    ? path.join(path.dirname(process.execPath), ".env.local")
    : path.join(__dirname, ".env.local");
  const env = loadEnvFile(envPath);
  const childEnv = {
    ...process.env,
    ...env,
    PORT: String(activePort),
    HOSTNAME: "localhost",
    NEXT_TELEMETRY_DISABLED: "1",
    ELECTRON_RUN_AS_NODE: "1",
  };

  let serverStdio = "ignore";
  if (DEBUG) {
    const logPath = path.join(os.tmpdir(), "amber-server.log");
    const logFd = fs.openSync(logPath, "a");
    serverStdio = ["ignore", logFd, logFd];
  }

  serverProc = spawn(process.execPath, ["server.js"], {
    cwd: standalone,
    env: childEnv,
    stdio: serverStdio,
    windowsHide: true,
  });

  serverProc.on("error", (err) => {
    throw err;
  });
  serverProc.on("exit", (code) => {
    if (mainWindow && !isQuitting) app.quit();
  });

  await new Promise((resolve, reject) => {
    waitForServer(`http://localhost:${activePort}`, 120000, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ------------------- Tray -------------------
function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, "build", "icon.png");
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  } else {
    icon = icon.resize({ width: 16, height: 16 });
  }
  tray = new Tray(icon);
  tray.setToolTip("Amber Music");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show / Hide",
        click: () => {
          if (!mainWindow) return;
          if (mainWindow.isVisible()) mainWindow.hide();
          else {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: "Launch at startup",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked });
        },
      },
      { type: "separator" },
      {
        label: "Quit Amber Music",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("double-click", () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  });
}

// ------------------- Window -------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Amber Music",
    backgroundColor: "#000000",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay:
      process.platform === "win32"
        ? { color: "#000000", symbolColor: "#ffffff", height: 40 }
        : false,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://localhost:${activePort}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    windowCreated = true;
    if (pendingAuthUrl) {
      mainWindow.webContents.send("ambermusic:auth-link", pendingAuthUrl);
      pendingAuthUrl = null;
    }
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting && app.isPackaged) {
      // Minimize to tray instead of quitting (Spotify-style) in packaged builds
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ------------------- App lifecycle -------------------
app.whenReady().then(async () => {
  app.setAppUserModelId("com.pant0x.ambermusic");
  registerProtocol();
  setupIpc();

  const startupUrl = extractDeepLink(process.argv);
  if (startupUrl) pendingAuthUrl = startupUrl;

  setupAutoUpdater();

  try {
    await startServer();
  } catch (err) {
    console.error("Failed to start app:", err.message);
    app.quit();
    return;
  }

  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && !windowCreated) {
      startServer().then(createWindow).catch(() => app.quit());
    }
  });
});

app.on("window-all-closed", () => {
  // Packaged: keep running in tray; quit explicitly via tray or OS shutdown.
  // Dev: closing the window quits the app.
  if (!app.isPackaged || isQuitting) {
    if (serverProc) {
      try {
        serverProc.kill();
      } catch (e) {}
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch (e) {}
  }
});