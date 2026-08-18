"use strict";

const { contextBridge, ipcRenderer } = require("electron");

if (document.documentElement) {
  document.documentElement.classList.add("amber-desktop");
}

contextBridge.exposeInMainWorld("amberMusic", {
  isDesktop: true,
  onAuthLink: (callback) => {
    ipcRenderer.on("ambermusic:auth-link", (_event, url) => {
      callback(url);
    });
  },
  openExternal: (url) => {
    ipcRenderer.invoke("ambermusic:open-external", url);
  },
});