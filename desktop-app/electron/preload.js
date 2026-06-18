const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appConfig", ipcRenderer.sendSync("config:get-sync"));

contextBridge.exposeInMainWorld("electronAPI", {
  products: {
    list: () => ipcRenderer.invoke("products:list"),
    listAll: () => ipcRenderer.invoke("products:list-all"),
    search: (q) => ipcRenderer.invoke("products:search", q),
    getByBarcode: (b) => ipcRenderer.invoke("products:get-by-barcode", b),
    create: (p) => ipcRenderer.invoke("products:create", p),
    update: (id, p) => ipcRenderer.invoke("products:update", id, p),
    delete: (id) => ipcRenderer.invoke("products:delete", id),
    archive: (id) => ipcRenderer.invoke("products:archive", id),
    restore: (id) => ipcRenderer.invoke("products:restore", id),
  },
  sales: {
    create: (s) => ipcRenderer.invoke("sales:create", s),
    listRecent: (l) => ipcRenderer.invoke("sales:list-recent", l),
    getById: (id) => ipcRenderer.invoke("sales:get-by-id", id),
    listByDate: (d) => ipcRenderer.invoke("sales:list-by-date", d),
    listAll: (o) => ipcRenderer.invoke("sales:list-all", o),
  },
  customers: {
    list: () => ipcRenderer.invoke("customers:list"),
    search: (q) => ipcRenderer.invoke("customers:search", q),
    create: (c) => ipcRenderer.invoke("customers:create", c),
    update: (id, c) => ipcRenderer.invoke("customers:update", id, c),
    delete: (id) => ipcRenderer.invoke("customers:delete", id),
    getById: (id) => ipcRenderer.invoke("customers:get-by-id", id),
  },
  arrears: {
    list: (s) => ipcRenderer.invoke("arrears:list", s),
    create: (a) => ipcRenderer.invoke("arrears:create", a),
    recordPayment: (id, a) => ipcRenderer.invoke("arrears:record-payment", id, a),
    delete: (id) => ipcRenderer.invoke("arrears:delete", id),
    settle: (id) => ipcRenderer.invoke("arrears:settle", id),
  },
  stock: {
    list: () => ipcRenderer.invoke("stock:list"),
    create: (p) => ipcRenderer.invoke("stock:create", p),
    update: (id, p) => ipcRenderer.invoke("stock:update", id, p),
  },
  distributors: {
    list: () => ipcRenderer.invoke("distributors:list"),
    create: (d) => ipcRenderer.invoke("distributors:create", d),
    update: (id, d) => ipcRenderer.invoke("distributors:update", id, d),
    delete: (id) => ipcRenderer.invoke("distributors:delete", id),
  },
  companies: {
    list: () => ipcRenderer.invoke("companies:list"),
    create: (c) => ipcRenderer.invoke("companies:create", c),
    update: (id, c) => ipcRenderer.invoke("companies:update", id, c),
    delete: (id) => ipcRenderer.invoke("companies:delete", id),
  },
  returns: {
    list: () => ipcRenderer.invoke("returns:list"),
    create: (r) => ipcRenderer.invoke("returns:create", r),
  },
  expenses: {
    list: () => ipcRenderer.invoke("expenses:list"),
    create: (e) => ipcRenderer.invoke("expenses:create", e),
    update: (id, e) => ipcRenderer.invoke("expenses:update", id, e),
    delete: (id) => ipcRenderer.invoke("expenses:delete", id),
  },
  dashboard: {
    stats: () => ipcRenderer.invoke("dashboard:stats"),
  },
  printers: {
    list: () => ipcRenderer.invoke("printers:list"),
    getConfig: () => ipcRenderer.invoke("config:get-printer"),
    saveConfig: (cfg) => ipcRenderer.invoke("config:save-printer", cfg),
  },
  settings: {
    backupCreate: () => ipcRenderer.invoke("settings:backup-create"),
    backupList: () => ipcRenderer.invoke("settings:backup-list"),
    backupDelete: (name) => ipcRenderer.invoke("settings:backup-delete", { name }),
    gdriveGetConfig: () => ipcRenderer.invoke("settings:gdrive-get-config"),
    gdriveSaveConfig: (cfg) => ipcRenderer.invoke("settings:gdrive-save-config", cfg),
  },
});

contextBridge.exposeInMainWorld("saveConfig", (cfg) => ipcRenderer.invoke("config:save", cfg));
contextBridge.exposeInMainWorld("getServerIp", () => ipcRenderer.invoke("server:ip"));
contextBridge.exposeInMainWorld("printReceipt", (sale, printerConfig) => ipcRenderer.invoke("print:receipt", sale, printerConfig));
contextBridge.exposeInMainWorld("printReturnReceipt", (returnData, sale, printerConfig) => ipcRenderer.invoke("print:return-receipt", returnData, sale, printerConfig));
contextBridge.exposeInMainWorld("authLogin", (creds) => ipcRenderer.invoke("auth:login", creds));
contextBridge.exposeInMainWorld("authLogout", (data) => ipcRenderer.invoke("auth:logout", data));
contextBridge.exposeInMainWorld("authRefresh", (data) => ipcRenderer.invoke("auth:refresh", data));
contextBridge.exposeInMainWorld("authMe", (data) => ipcRenderer.invoke("auth:me", data));
contextBridge.exposeInMainWorld("verifyAdminPassword", (password) => ipcRenderer.invoke("auth:verify-password", { password }));
