"use strict";

const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const PORT = Number(process.env.PORT || 3210);
let mainWindow = null;
let serverProc = null;
let windowCreated = false;

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

function waitForServer(url, timeoutMs, cb) {
  const startedAt = Date.now();
  const tick = () => {
    const req = http.get(url, (res) => {
      res.resume();
      cb(null);
    });
    req.on("error", () => {
      if (Date.now() - startedAt > timeoutMs) {
        cb(new Error("Server did not start in time"));
        return;
      }
      setTimeout(tick, 400);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      setTimeout(tick, 400);
    });
  };
  tick();
}

function startServer() {
  return new Promise((resolve, reject) => {
    const standalone = getStandaloneDir();
    if (!standalone) {
      reject(new Error("standalone build not found. Run: npm run build"));
      return;
    }

    // Load .env.local and pass through (server-side secrets needed at runtime)
    const env = loadEnvFile(path.join(__dirname, ".env.local"));
    const childEnv = {
      ...process.env,
      ...env,
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
      ELECTRON_RUN_AS_NODE: "1",
    };

    serverProc = spawn(process.execPath, ["server.js"], {
      cwd: standalone,
      env: childEnv,
      stdio: app.isPackaged ? "ignore" : "inherit",
      windowsHide: true,
    });

    serverProc.on("error", reject);
    serverProc.on("exit", (code) => {
      if (mainWindow) app.quit();
    });

    waitForServer(`http://127.0.0.1:${PORT}`, 30000, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    windowCreated = true;
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer()
    .then(() => {
      createWindow();
    })
    .catch((err) => {
      console.error("Failed to start app:", err.message);
      app.quit();
    });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && !windowCreated) {
      startServer().then(createWindow).catch(() => app.quit());
    }
  });
});

app.on("window-all-closed", () => {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch (e) {}
  }
  app.quit();
});

app.on("will-quit", () => {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch (e) {}
  }
});