// Platform Detection
export function isMacOS(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function isWindows(): boolean {
  return typeof navigator !== "undefined" && /Win/.test(navigator.platform);
}

export function isLinux(): boolean {
  return typeof navigator !== "undefined" && /Linux/.test(navigator.platform);
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && "electron" in window;
}

export function isWeb(): boolean {
  return !isTauri() && !isElectron();
}

export function applyPlatformAttributes() {
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    if (isMacOS()) html.classList.add("platform-macos");
    if (isWindows()) html.classList.add("platform-windows");
    if (isLinux()) html.classList.add("platform-linux");
    if (isTauri()) html.classList.add("platform-tauri");
    if (isElectron()) html.classList.add("platform-electron");
  }
}

export function detectTilingWindowManager(): Promise<void> {
  return Promise.resolve();
}