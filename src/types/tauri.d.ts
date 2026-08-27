declare module "@tauri-apps/api" {
  export const invoke: any;
  export const event: any;
  export const window: any;
  export function isTauri(): boolean;
}

declare module "@tauri-apps/api/app" {
  export function getVersion(): Promise<string>;
  export function getName(): Promise<string>;
  export function getTauriVersion(): Promise<string>;
}

declare module "@tauri-apps/api/core" {
  export function invoke<T = any>(cmd: string, args?: any): Promise<T>;
  export function isTauri(): boolean;
}

declare module "@tauri-apps/api/event" {
  export type UnlistenFn = () => void;
  export function emit<T = any>(event: string, payload?: T): Promise<void>;
  export function listen<T = any>(event: string, handler: (event: any) => void): Promise<UnlistenFn>;
  export function once<T = any>(event: string, handler: (event: any) => void): Promise<UnlistenFn>;
}

declare module "@tauri-apps/api/window" {
  export function getCurrentWindow(): any;
  export function currentMonitor(): Promise<any>;
  export function primaryMonitor(): Promise<any>;
  export function availableMonitors(): Promise<any[]>;
  export function cursorPosition(): Promise<any>;
  export const WebviewWindow: any;
  export class LogicalSize {
    width: number;
    height: number;
    constructor(width: number, height: number);
  }
  export class PhysicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }
}

declare module "@tauri-apps/api/dpi" {
  export class PhysicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }
  export class PhysicalSize {
    width: number;
    height: number;
    constructor(width: number, height: number);
  }
  export class LogicalSize {
    width: number;
    height: number;
    constructor(width: number, height: number);
  }
}

declare module "@tauri-apps/api/webviewWindow" {
  export class WebviewWindow {
    constructor(label: string, options?: any);
    static getByLabel(label: string): any;
  }
}

declare module "@tauri-apps/plugin-autostart" {
  export function enable(): Promise<void>;
  export function disable(): Promise<void>;
  export function isEnabled(): Promise<boolean>;
  export function setAutoStart(enabled: boolean): Promise<void>;
}

declare module "@tauri-apps/plugin-dialog" {
  export function open(options?: any): Promise<any>;
  export function save(options?: any): Promise<any>;
}

declare module "@tauri-apps/plugin-opener" {
  export function open(path: string): Promise<void>;
  export function openUrl(url: string): Promise<void>;
}

declare module "@tauri-apps/plugin-process" {
  export function exit(code?: number): Promise<void>;
  export function relaunch(): Promise<void>;
}

declare module "@tauri-apps/plugin-updater" {
  export type DownloadEvent = any;
  export type Update = any;
  export function check(): Promise<any>;
}
