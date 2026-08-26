// Autostart Settings
export function setAutostartEnabled(enabled: boolean) {
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    import("@tauri-apps/plugin-autostart").then(({ setAutoStart }) => {
      setAutoStart(enabled).catch(console.error);
    });
  }
}