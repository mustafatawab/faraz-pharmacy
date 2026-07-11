const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appConfig", ipcRenderer.sendSync("config:get-sync"));

contextBridge.exposeInMainWorld("electronAPI", {
  printers: {
    list: () => ipcRenderer.invoke("printers:list"),
    getConfig: () => ipcRenderer.invoke("config:get-printer"),
    saveConfig: (cfg) => ipcRenderer.invoke("config:save-printer", cfg),
  },
  settings: {
    backupCreate: () => ipcRenderer.invoke("settings:backup-create"),
    backupList: () => ipcRenderer.invoke("settings:backup-list"),
    backupDelete: (name) => ipcRenderer.invoke("settings:backup-delete", { name }),
    backupRestore: (name) => ipcRenderer.invoke("settings:backup-restore", { name }),
    backupDirectoryPick: () => ipcRenderer.invoke("settings:backup-directory-pick"),
    getBackupDirectory: () => ipcRenderer.invoke("settings:get-backup-directory"),
    gdriveGetConfig: () => ipcRenderer.invoke("settings:gdrive-get-config"),
    gdriveSaveConfig: (cfg) => ipcRenderer.invoke("settings:gdrive-save-config", cfg),
  },
});

contextBridge.exposeInMainWorld("saveConfig", (cfg) => ipcRenderer.invoke("config:save", cfg));
contextBridge.exposeInMainWorld("getServerIp", () => ipcRenderer.invoke("server:ip"));
contextBridge.exposeInMainWorld("printReceipt", (sale, printerConfig) => ipcRenderer.invoke("print:receipt", sale, printerConfig));
contextBridge.exposeInMainWorld("printReturnReceipt", (returnData, sale, printerConfig) => ipcRenderer.invoke("print:return-receipt", returnData, sale, printerConfig));
contextBridge.exposeInMainWorld("printBarcodeLabel", (barcode, productName, price, copies) => ipcRenderer.invoke("print:barcode-label", barcode, productName, price, copies));
contextBridge.exposeInMainWorld("getUSBPrinters", () => ipcRenderer.invoke("usb-printers:list"));
