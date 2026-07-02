import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { prisma } from "../../services/prisma";

const dataDir = process.env.FARAZ_DATA_DIR || path.join(os.homedir(), ".faraz-pharmacy");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function getConfigPath() {
  ensureDataDir();
  return path.join(dataDir, "config.json");
}

function loadConfig(): Record<string, unknown> {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(cfg: Record<string, unknown>) {
  ensureDataDir();
  fs.writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2));
}

export const settingsService = {
  // Backups
  async createBackup() {
    ensureDataDir();
    const backupDir = path.join(dataDir, "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupName = `faraz-pharmacy-backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupName);

    const dbUrl = process.env.DATABASE_URL || "";
    execSync(`pg_dump "${dbUrl}" > "${backupPath}"`);

    const stat = fs.statSync(backupPath);
    return {
      success: true,
      name: backupName,
      path: backupPath,
      size: stat.size,
      createdAt: stat.birthtime?.toISOString() || stat.mtime.toISOString(),
    };
  },

  listBackups() {
    ensureDataDir();
    const backupDir = path.join(dataDir, "backups");
    if (!fs.existsSync(backupDir)) return [];

    return fs.readdirSync(backupDir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const fp = path.join(backupDir, f);
        const stat = fs.statSync(fp);
        return { name: f, path: fp, size: stat.size, createdAt: (stat.birthtime || stat.mtime).toISOString() };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  deleteBackup(name: string) {
    const backupDir = path.join(dataDir, "backups");
    const fp = path.join(backupDir, name);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    return { success: true };
  },

  restoreBackup(name: string) {
    const backupDir = path.join(dataDir, "backups");
    const backupPath = path.join(backupDir, name);
    if (!fs.existsSync(backupPath)) throw new Error("Backup file not found");

    const dbUrl = process.env.DATABASE_URL || "";
    execSync(`psql "${dbUrl}" < "${backupPath}"`);
    return { success: true };
  },

  getBackupDirectory() {
    ensureDataDir();
    return { path: path.join(dataDir, "backups") };
  },

  // Google Drive config
  getGdriveConfig() {
    const cfg = loadConfig();
    return (cfg.googleDrive as Record<string, unknown>) || {
      clientId: "", clientSecret: "", redirectUri: "", refreshToken: "", autoUpload: false, connected: false,
    };
  },

  saveGdriveConfig(gdriveConfig: Record<string, unknown>) {
    const cfg = loadConfig();
    cfg.googleDrive = gdriveConfig;
    saveConfig(cfg);
    return { success: true };
  },
};
