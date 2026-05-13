const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  getRoles() {
    return ipcRenderer.invoke("pet:get-roles");
  },
  close() {
    ipcRenderer.send("pet:close");
  },
  setIgnoreMouse(shouldIgnore) {
    ipcRenderer.send("pet:set-ignore-mouse", shouldIgnore);
  },
});
