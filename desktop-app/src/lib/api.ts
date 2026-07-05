import type {
  Product, ProductInput, Customer, CustomerInput, Sale, SaleInput,
  Arrear, ArrearInput, StockPurchase, StockInput, Distributor, DistributorInput,
  Company, CompanyInput, ReturnEntry, ReturnInput, Expense, ExpenseInput,
  Category, CategoryInput, DashboardStats,
} from "@/types";
import type { BackupResult, BackupEntry, GDriveConfig } from "@/types/electron";

function getApiUrl(): string {
  if (window.appConfig?.serverUrl) return window.appConfig.serverUrl;
  return import.meta.env.VITE_API_URL || "http://localhost:3001";
}

function getToken(): string | null {
  return localStorage.getItem("faraz_access_token");
}

async function fetchJson<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const api = {
  auth: {
    login: (username: string, password: string): Promise<{
      accessToken: string; refreshToken: string; csrfToken: string;
      user: { id: string; username: string; role: string };
    }> =>
      fetchJson("POST", "/api/auth/login", { username, password }, false),
    refresh: (refreshToken: string): Promise<{
      accessToken: string; refreshToken: string; csrfToken: string;
      user: { id: string; username: string; role: string };
    }> =>
      fetchJson("POST", "/api/auth/refresh", { refreshToken }, false),
    logout: (accessToken: string): Promise<{ success: boolean }> =>
      fetchJson("POST", "/api/auth/logout", { accessToken }),
    verifyPassword: (password: string): Promise<{ valid: boolean }> =>
      fetchJson("POST", "/api/auth/verify-password", { password }, false),
    generateRecoveryKey: (): Promise<{ phrase: string }> =>
      fetchJson("POST", "/api/auth/generate-recovery-key", undefined, false),
    recoverPassword: (phrase: string, newPassword: string): Promise<{ success: boolean; error?: string }> =>
      fetchJson("POST", "/api/auth/recover-password", { phrase, newPassword }, false),
  },
  products: {
    list: (): Promise<Product[]> => fetchJson("GET", "/api/products"),
    search: (q: string): Promise<Product[]> => fetchJson("GET", `/api/products/search?q=${encodeURIComponent(q)}`),
    getByBarcode: (b: string): Promise<Product | null> => fetchJson("GET", `/api/products/barcode/${encodeURIComponent(b)}`),
    create: (p: ProductInput): Promise<Product> => fetchJson("POST", "/api/products", p),
    update: (id: string, p: ProductInput): Promise<Product> => fetchJson("PUT", `/api/products/${id}`, p),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/products/${id}`),
    archive: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/products/${id}`),
    restore: (id: string): Promise<{ success: boolean }> => fetchJson("POST", `/api/products/${id}/restore`),
    listAll: (): Promise<Product[]> => fetchJson("GET", "/api/products?includeArchived=true"),
  },
  sales: {
    create: (s: SaleInput): Promise<Sale> => fetchJson("POST", "/api/sales", s),
    listRecent: (l = 10): Promise<Sale[]> => fetchJson("GET", `/api/sales/recent?limit=${l}`),
    getById: (id: string): Promise<Sale | null> => fetchJson("GET", `/api/sales/${id}`),
    listByDate: (dateStr: string): Promise<Sale[]> => fetchJson("GET", `/api/sales/date/${dateStr}`),
    listAll: (opts?: { search?: string; dateFrom?: string; dateTo?: string }): Promise<Sale[]> => {
      const params = opts ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(opts).filter(([_, v]) => v))).toString() : "";
      return fetchJson("GET", `/api/sales${params}`);
    },
  },
  customers: {
    list: (): Promise<Customer[]> => fetchJson("GET", "/api/customers"),
    search: (q: string): Promise<Customer[]> => fetchJson("GET", `/api/customers/search?q=${encodeURIComponent(q)}`),
    create: (c: CustomerInput): Promise<Customer> => fetchJson("POST", "/api/customers", c),
    update: (id: string, c: CustomerInput): Promise<Customer> => fetchJson("PUT", `/api/customers/${id}`, c),
    delete: (id: string, opts?: { force?: boolean }): Promise<{ success: boolean }> =>
      fetchJson("DELETE", `/api/customers/${id}${opts?.force ? "?force=true" : ""}`),
    getById: (id: string): Promise<Customer | null> => fetchJson("GET", `/api/customers/${id}`),
  },
  arrears: {
    list: (status?: string): Promise<Arrear[]> => fetchJson("GET", `/api/arrears${status ? `?status=${status}` : ""}`),
    create: (a: ArrearInput): Promise<Arrear> => fetchJson("POST", "/api/arrears", a),
    recordPayment: (id: string, amount: number): Promise<Arrear> => fetchJson("POST", `/api/arrears/${id}/pay`, { amount }),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/arrears/${id}`),
    settle: (id: string): Promise<Arrear> => fetchJson("POST", `/api/arrears/${id}/settle`),
  },
  stock: {
    list: (): Promise<StockPurchase[]> => fetchJson("GET", "/api/stock"),
    create: (p: StockInput): Promise<StockPurchase> => fetchJson("POST", "/api/stock", p),
    update: (id: string, p: StockInput): Promise<StockPurchase> => fetchJson("PUT", `/api/stock/${id}`, p),
  },
  distributors: {
    list: (): Promise<Distributor[]> => fetchJson("GET", "/api/distributors"),
    create: (d: DistributorInput): Promise<Distributor> => fetchJson("POST", "/api/distributors", d),
    update: (id: string, d: DistributorInput): Promise<Distributor> => fetchJson("PUT", `/api/distributors/${id}`, d),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/distributors/${id}`),
  },
  companies: {
    list: (): Promise<Company[]> => fetchJson("GET", "/api/companies"),
    create: (c: CompanyInput): Promise<Company> => fetchJson("POST", "/api/companies", c),
    update: (id: string, c: CompanyInput): Promise<Company> => fetchJson("PUT", `/api/companies/${id}`, c),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/companies/${id}`),
  },
  returns: {
    list: (): Promise<ReturnEntry[]> => fetchJson("GET", "/api/returns"),
    create: (r: ReturnInput): Promise<ReturnEntry> => fetchJson("POST", "/api/returns", r),
  },
  expenses: {
    list: (): Promise<Expense[]> => fetchJson("GET", "/api/expenses"),
    create: (e: ExpenseInput): Promise<Expense> => fetchJson("POST", "/api/expenses", e),
    update: (id: string, e: ExpenseInput): Promise<Expense> => fetchJson("PUT", `/api/expenses/${id}`, e),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/expenses/${id}`),
  },
  categories: {
    list: (): Promise<Category[]> => fetchJson("GET", "/api/categories"),
    create: (c: CategoryInput): Promise<Category> => fetchJson("POST", "/api/categories", c),
    update: (id: string, c: CategoryInput): Promise<Category> => fetchJson("PUT", `/api/categories/${id}`, c),
    delete: (id: string): Promise<{ success: boolean }> => fetchJson("DELETE", `/api/categories/${id}`),
  },
  dashboard: {
    stats: (): Promise<DashboardStats> => fetchJson("GET", "/api/dashboard/stats"),
  },
  settings: {
    backupCreate: (): Promise<BackupResult> => fetchJson("POST", "/api/settings/backup"),
    backupList: (): Promise<BackupEntry[]> => fetchJson("GET", "/api/settings/backups"),
    backupDelete: (name: string): Promise<{ success: boolean; error?: string }> =>
      fetchJson("DELETE", "/api/settings/backup", { name }),
    backupRestore: (name: string): Promise<{ success: boolean; error?: string }> =>
      fetchJson("POST", "/api/settings/backup/restore", { name }),
    getBackupDirectory: (): Promise<{ path: string }> => fetchJson("GET", "/api/settings/backup/directory"),
    gdriveGetConfig: (): Promise<GDriveConfig> => fetchJson("GET", "/api/settings/gdrive"),
    gdriveSaveConfig: (cfg: GDriveConfig): Promise<{ success: boolean }> =>
      fetchJson("PUT", "/api/settings/gdrive", cfg),
  },
};

export { api };
