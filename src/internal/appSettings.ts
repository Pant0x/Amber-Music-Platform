import { invoke, isTauri } from "@tauri-apps/api/core";
import { logInternalWarn } from "./logging";

const WEB_STORAGE_PREFIX = "opentune:app_setting:";

function getInvokeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;

    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return String(error);
}

export async function getAppSetting<T>(key: string): Promise<T | null> {
  if (!isTauri()) {
    try {
      const stored = localStorage.getItem(`${WEB_STORAGE_PREFIX}${key}`);
      return stored !== null ? (JSON.parse(stored) as T) : null;
    } catch {
      return null;
    }
  }
  try {
    return await invoke<T | null>("app_setting_get", { key });
  } catch (error) {
    logInternalWarn("appSetting.get failed", {
      key,
      error: getInvokeErrorMessage(error),
    });
    return null;
  }
}

export async function setAppSetting<T>(key: string, value: T): Promise<void> {
  if (!isTauri()) {
    try {
      localStorage.setItem(`${WEB_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch {}
    return;
  }
  try {
    await invoke("app_setting_set", { key, value });
  } catch (error) {
    logInternalWarn("appSetting.set failed", {
      key,
      error: getInvokeErrorMessage(error),
    });
  }
}

export async function removeAppSetting(key: string): Promise<void> {
  if (!isTauri()) {
    try {
      localStorage.removeItem(`${WEB_STORAGE_PREFIX}${key}`);
    } catch {}
    return;
  }
  try {
    await invoke("app_setting_remove", { key });
  } catch (error) {
    logInternalWarn("appSetting.remove failed", {
      key,
      error: getInvokeErrorMessage(error),
    });
  }
}

export async function clearAppSettings(): Promise<void> {
  if (!isTauri()) {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(WEB_STORAGE_PREFIX)) localStorage.removeItem(k);
      });
    } catch {}
    return;
  }
  try {
    await invoke("app_settings_clear");
  } catch (error) {
    logInternalWarn("appSettings.clear failed", {
      error: getInvokeErrorMessage(error),
    });
    throw error;
  }
}
