import {
  disable,
  enable,
  isEnabled,
} from "@tauri-apps/plugin-autostart";
import { isTauri } from "@tauri-apps/api/core";

export function getAutostartEnabled() {
  if (!isTauri()) return Promise.resolve(false);
  return isEnabled();
}

export async function setAutostartEnabled(enabled: boolean) {
  if (!isTauri()) return;
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
}
