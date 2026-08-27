// Autostart Settings
export function setAutostartEnabled(enabled: boolean) {
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    import("@tauri-apps/plugin-autostart").then((mod: any) => {
      if (enabled) {
        (mod.enable || mod.setAutoStart)?.().catch(console.error);
      } else {
        (mod.disable || mod.setAutoStart)?.().catch(console.error);
      }
    });
  }
}