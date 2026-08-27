import { invoke } from "@tauri-apps/api/core";
import { logInternalWarn } from "./logging";

const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

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
  if (!isTauri) {
    try {
      const item = localStorage.getItem(`amber_setting_${key}`);
      return item ? JSON.parse(item) : null;
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
  if (!isTauri) {
    try {
      localStorage.setItem(`amber_setting_${key}`, JSON.stringify(value));
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
  if (!isTauri) {
    try {
      localStorage.removeItem(`amber_setting_${key}`);
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
  if (!isTauri) {
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
