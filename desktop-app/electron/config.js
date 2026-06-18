const path = require("path");
const os = require("os");
const fs = require("fs");

const DATA_DIR = path.join(os.homedir(), ".faraz-pharmacy");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { mode: null, serverUrl: "", serverPort: 3456, printer: { paperSize: "thermal", deviceName: null } };
  }
}

function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function isConfigured() {
  return loadConfig().mode !== null;
}

module.exports = { loadConfig, saveConfig, isConfigured };
