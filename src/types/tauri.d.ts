declare module "@tauri-apps/api" {
  export const invoke: any;
  export const event: any;
  export const window: any;
}

declare module "@tauri-apps/api/core" {
  export const invoke: any;
}

declare module "@tauri-apps/api/event" {
  export const emit: any;
  export const listen: any;
}

declare module "@tauri-apps/api/window" {
  export const getCurrentWindow: any;
  export const currentMonitor: any;
  export const primaryMonitor: any;
  export const availableMonitors: any;
  export const WebviewWindow: any;
}

declare module "@tauri-apps/api/dpi" {
  export const PhysicalPosition: any;
}

declare module "@tauri-apps/plugin-autostart" {
  export const enable: any;
  export const disable: any;
  export const isEnabled: any;
  export const setAutoStart: any;
}

declare module "@tauri-apps/plugin-dialog" {
  export const open: any;
  export const save: any;
}

declare module "@tauri-apps/plugin-opener" {
  export const open: any;
}

declare module "@tauri-apps/plugin-process" {
  export const exit: any;
  export const relaunch: any;
}

declare module "@tauri-apps/plugin-updater" {
  export const check: any;
}
