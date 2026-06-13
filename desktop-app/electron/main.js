const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const { initializeDatabase } = require("./database");
const { registerHandlers } = require("./ipc-handlers");
const { startServer } = require("./server");
const { loadConfig, saveConfig } = require("./config");
const { printReceipt } = require("./printer");

const isDev = process.env.NODE_ENV === "development";

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

let serverStarted = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Faraz Pharmacy",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
    titleBarStyle: "hiddenInset",
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.once("ready-to-show", () => win.show());
}

app.whenReady().then(() => {
  const config = loadConfig();

  ipcMain.on("config:get-sync", (event) => {
    event.returnValue = loadConfig();
  });

  ipcMain.handle("config:save", (_, cfg) => {
    saveConfig(cfg);
    if (cfg.mode === "server" && !serverStarted) {
      startServer(cfg.serverPort || 3456);
      serverStarted = true;
    }
    return { success: true };
  });

  ipcMain.handle("server:ip", () => getLocalIp());

  ipcMain.handle("print:receipt", async (_, sale) => {
    try {
      await printReceipt(sale);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  initializeDatabase();
  registerHandlers();

  if (config.mode === "server") {
    startServer(config.serverPort || 3456);
    serverStarted = true;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
