const { app, BrowserWindow, ipcMain, screen } = require("electron");
const fs = require("fs");
const path = require("path");

let win;

function createWindow() {
  const displayBounds = screen.getPrimaryDisplay().bounds;
  win = new BrowserWindow({
    x: displayBounds.x,
    y: displayBounds.y,
    width: displayBounds.width,
    height: displayBounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.loadFile(path.join(__dirname, "index.html"));
}

function readRoles() {
  const rolesDir = path.join(__dirname, "roles");
  if (!fs.existsSync(rolesDir)) return [];

  return fs
    .readdirSync(rolesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const roleName = entry.name;
      const roleDir = path.join(rolesDir, roleName);
      const styles = fs
        .readdirSync(roleDir, { withFileTypes: true })
        .filter((styleEntry) => styleEntry.isFile() && path.extname(styleEntry.name).toLowerCase() === ".png")
        .map((styleEntry) => {
          const styleName = path.basename(styleEntry.name, ".png");
          return {
            name: styleName,
            src: `./roles/${roleName}/${styleEntry.name}`,
          };
        })
        .sort((a, b) => {
          if (a.name === "默认") return -1;
          if (b.name === "默认") return 1;
          return a.name.localeCompare(b.name, "zh-CN");
        });

      return {
        name: roleName,
        styles,
      };
    })
    .filter((role) => role.styles.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("pet:close", () => {
  app.quit();
});

ipcMain.on("pet:set-ignore-mouse", (_event, shouldIgnore) => {
  if (!win) return;
  win.setIgnoreMouseEvents(Boolean(shouldIgnore), { forward: true });
});

ipcMain.handle("pet:get-roles", () => readRoles());
