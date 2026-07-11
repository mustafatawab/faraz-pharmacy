import type { PrinterConfig } from "./index";

export interface ElectronAPI {
  printers: {
    list(): Promise<{ name: string; displayName: string; isDefault: boolean }[]>;
    getConfig(): Promise<PrinterConfig>;
    saveConfig(cfg: PrinterConfig): Promise<{ success: boolean }>;
  };
  settings: {
    backupCreate(): Promise<BackupResult>;
    backupList(): Promise<BackupEntry[]>;
    backupDelete(name: string): Promise<{ success: boolean; error?: string }>;
    backupRestore(name: string): Promise<{ success: boolean; error?: string }>;
    backupDirectoryPick(): Promise<{ canceled: boolean; path?: string }>;
    getBackupDirectory(): Promise<{ path: string }>;
    gdriveGetConfig(): Promise<GDriveConfig>;
    gdriveSaveConfig(cfg: GDriveConfig): Promise<{ success: boolean }>;
  };
}

export interface AppConfig {
  mode?: string;
  serverUrl?: string;
  serverPort?: number;
  printer?: PrinterConfig;
}

export interface BackupEntry {
  name: string;
  path: string;
  size: number;
  createdAt: string;
}

export interface BackupResult {
  success: boolean;
  name?: string;
  path?: string;
  size?: number;
  createdAt?: string;
  error?: string;
}

export interface USBPrinterInfo {
  vendorId: number;
  productId: number;
  productName: string;
  serialNumber: string | null;
}

export interface GDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  autoUpload: boolean;
  connected: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    saveConfig: (config: { mode: string; serverUrl?: string }) => Promise<{ success: boolean }>;
    getServerIp: () => Promise<string>;
    appConfig: AppConfig;
    printReceipt: (sale: unknown, printerConfig?: PrinterConfig) => Promise<{ success: boolean; error?: string }>;
    printReturnReceipt: (returnData: unknown, sale: unknown, printerConfig?: PrinterConfig) => Promise<{ success: boolean; error?: string }>;
    printBarcodeLabel: (barcode: string, productName: string, price: number, copies: number) => Promise<{ success: boolean; error?: string }>;
    getUSBPrinters: () => Promise<USBPrinterInfo[]>;
  }
}
