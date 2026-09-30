import { useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { logInternalError } from "../../internal/logging";
import { isWindows } from "../platform";
import {
  hydrateLocalBooleanSetting,
  readLocalBooleanSetting,
  writeLocalBooleanSetting,
} from "../../internal/durableLocalSetting";

const WINDOWS_STYLE_STORAGE_KEY = "windows-style-window-controls";
const NATIVE_CONTROLS_STORAGE_KEY = "native-window-controls";
const FORCE_CONTROLS_STORAGE_KEY = "force-window-controls-on-tiling-wm";
const IN_APP_CONTROLS_MIGRATED_KEY = "opentune:in-app-controls-v1";
const CHANGE_EVENT = "window-controls-change";

function ensureInAppControlsDefault() {
  if (typeof window === "undefined") return;
  try {
    if (!localStorage.getItem(IN_APP_CONTROLS_MIGRATED_KEY) && !localStorage.getItem("amber:in-app-controls-v1")) {
      localStorage.setItem(IN_APP_CONTROLS_MIGRATED_KEY, "true");
      localStorage.setItem(NATIVE_CONTROLS_STORAGE_KEY, "false");
      if (isWindows) {
        localStorage.setItem(WINDOWS_STYLE_STORAGE_KEY, "true");
      }
    }
  } catch {}
}

ensureInAppControlsDefault();

function readBooleanSetting(key: string, defaultValue = false) {
  return readLocalBooleanSetting(key, defaultValue);
}

function writeBooleanSetting(key: string, enabled: boolean) {
  writeLocalBooleanSetting(key, enabled, CHANGE_EVENT);
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readWindowsStyleWindowControls() {
  if (isWindows) return true;
  ensureInAppControlsDefault();
  return readBooleanSetting(WINDOWS_STYLE_STORAGE_KEY, isWindows);
}

function readNativeWindowControls() {
  if (isWindows) return false;
  ensureInAppControlsDefault();
  return readLocalBooleanSetting(NATIVE_CONTROLS_STORAGE_KEY, false);
}

function readForceWindowControls() {
  // Default off: tiling compositors hide the app-drawn buttons by default (see
  // TitleBar's showCustomWindowControls). This is the opt-in escape hatch for anyone
  // who still wants a close/minimize button under a tiling WM.
  return readBooleanSetting(FORCE_CONTROLS_STORAGE_KEY, false);
}

function emitWindowControlsChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setWindowsStyleWindowControls(enabled: boolean) {
  writeBooleanSetting(WINDOWS_STYLE_STORAGE_KEY, enabled);
}

export function setNativeWindowControls(enabled: boolean) {
  if (isWindows) {
    writeBooleanSetting(NATIVE_CONTROLS_STORAGE_KEY, false);
    void applyNativeWindowControls(false);
    return;
  }
  writeBooleanSetting(NATIVE_CONTROLS_STORAGE_KEY, enabled);
  void applyNativeWindowControls(enabled);
}

export function setForceWindowControls(enabled: boolean) {
  writeBooleanSetting(FORCE_CONTROLS_STORAGE_KEY, enabled);
}

export async function applyNativeWindowControls(enabled = readNativeWindowControls()) {
  if (!isTauri()) return;
  const actual = isWindows ? false : enabled;
  try {
    await getCurrentWindow().setDecorations(actual);
    document.documentElement.toggleAttribute("data-native-window-controls", actual);
  } catch (error) {
    document.documentElement.toggleAttribute("data-native-window-controls", false);
    logInternalError("windowControls.applyNativeWindowControls failed", error);
  } finally {
    emitWindowControlsChange();
  }
}

export async function hydrateWindowControlSettings() {
  if (!isTauri()) return;
  if (isWindows) {
    try {
      localStorage.setItem(NATIVE_CONTROLS_STORAGE_KEY, "false");
      localStorage.setItem(WINDOWS_STYLE_STORAGE_KEY, "true");
    } catch {}
    void writeBooleanSetting(NATIVE_CONTROLS_STORAGE_KEY, false);
    void writeBooleanSetting(WINDOWS_STYLE_STORAGE_KEY, true);
    await applyNativeWindowControls(false);
    return;
  }
  ensureInAppControlsDefault();
  await Promise.all([
    hydrateLocalBooleanSetting(WINDOWS_STYLE_STORAGE_KEY, isWindows, CHANGE_EVENT),
    hydrateLocalBooleanSetting(
      NATIVE_CONTROLS_STORAGE_KEY,
      false,
      CHANGE_EVENT,
      () => applyNativeWindowControls(false),
    ),
    hydrateLocalBooleanSetting(FORCE_CONTROLS_STORAGE_KEY, false, CHANGE_EVENT),
  ]);
}

export function useWindowsStyleWindowControls() {
  return useSyncExternalStore(subscribe, readWindowsStyleWindowControls, () => false);
}

export function useNativeWindowControls() {
  return useSyncExternalStore(subscribe, readNativeWindowControls, () => false);
}

export function useForceWindowControls() {
  return useSyncExternalStore(subscribe, readForceWindowControls, () => false);
}
