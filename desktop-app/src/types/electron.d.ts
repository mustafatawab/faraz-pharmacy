import type {
  Product, ProductInput, Sale, SaleInput, Customer, CustomerInput,
  Arrear, ArrearInput, StockPurchase, StockInput, Distributor, DistributorInput,
  Company, CompanyInput, ReturnEntry, ReturnInput, Expense, ExpenseInput,
  DashboardStats, PrinterConfig,
} from "./index";

export interface ElectronAPI {
  products: {
    list(): Promise<Product[]>;
    listAll(): Promise<Product[]>;
    search(q: string): Promise<Product[]>;
    getByBarcode(b: string): Promise<Product | null>;
    create(p: ProductInput): Promise<Product>;
    update(id: string, p: ProductInput): Promise<Product>;
    delete(id: string): Promise<{ success: boolean }>;
    archive(id: string): Promise<{ success: boolean }>;
    restore(id: string): Promise<{ success: boolean }>;
  };
  sales: {
    create(s: SaleInput): Promise<Sale>;
    listRecent(l?: number): Promise<Sale[]>;
    getById(id: string): Promise<Sale | null>;
    listByDate(dateStr: string): Promise<Sale[]>;
    listAll(opts?: { search?: string; dateFrom?: string; dateTo?: string }): Promise<Sale[]>;
  };
  customers: {
    list(): Promise<Customer[]>;
    search(q: string): Promise<Customer[]>;
    create(c: CustomerInput): Promise<Customer>;
    update(id: string, c: CustomerInput): Promise<Customer>;
    delete(id: string): Promise<{ success: boolean }>;
    getById(id: string): Promise<Customer | null>;
  };
  arrears: {
    list(status?: string): Promise<Arrear[]>;
    create(a: ArrearInput): Promise<Arrear>;
    recordPayment(id: string, amount: number): Promise<Arrear>;
    delete(id: string): Promise<{ success: boolean }>;
    settle(id: string): Promise<Arrear>;
  };
  stock: {
    list(): Promise<StockPurchase[]>;
    create(p: StockInput): Promise<StockPurchase>;
    update(id: string, p: StockInput): Promise<StockPurchase>;
  };
  distributors: {
    list(): Promise<Distributor[]>;
    create(d: DistributorInput): Promise<Distributor>;
    update(id: string, d: DistributorInput): Promise<Distributor>;
    delete(id: string): Promise<{ success: boolean }>;
  };
  companies: {
    list(): Promise<Company[]>;
    create(c: CompanyInput): Promise<Company>;
    update(id: string, c: CompanyInput): Promise<Company>;
    delete(id: string): Promise<{ success: boolean }>;
  };
  returns: {
    list(): Promise<ReturnEntry[]>;
    create(r: ReturnInput): Promise<ReturnEntry>;
  };
  expenses: {
    list(): Promise<Expense[]>;
    create(e: ExpenseInput): Promise<Expense>;
    update(id: string, e: ExpenseInput): Promise<Expense>;
    delete(id: string): Promise<{ success: boolean }>;
  };
  dashboard: {
    stats(): Promise<DashboardStats>;
  };
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
  mode: "server" | "client" | null;
  serverUrl: string;
  serverPort: number;
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

export interface GDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  autoUpload: boolean;
  connected: boolean;
}

interface AuthResponse {
  user?: { id: string; username: string; role: string };
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
  accessExpires?: string;
  refreshExpires?: string;
  error?: string;
  success?: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    saveConfig: (config: { mode: string; serverUrl?: string }) => Promise<{ success: boolean }>;
    getServerIp: () => Promise<string>;
    appConfig: AppConfig;
    printReceipt: (sale: unknown, printerConfig?: PrinterConfig) => Promise<{ success: boolean; error?: string }>;
    printReturnReceipt: (returnData: unknown, sale: unknown, printerConfig?: PrinterConfig) => Promise<{ success: boolean; error?: string }>;
    authLogin: (creds: { username: string; password: string }) => Promise<AuthResponse>;
    authLogout: (data: { accessToken: string }) => Promise<{ success: boolean }>;
    authRefresh: (data: { refreshToken: string | null }) => Promise<AuthResponse>;
    authMe: (data: { accessToken: string }) => Promise<AuthResponse>;
    verifyAdminPassword: (password: string) => Promise<{ valid: boolean }>;
  }
}
