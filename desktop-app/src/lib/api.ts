import type {
  Product, ProductInput, Customer, CustomerInput, Sale, SaleInput,
  Arrear, ArrearInput, StockPurchase, StockInput, Distributor, DistributorInput,
  Company, CompanyInput, ReturnEntry, ReturnInput, Expense, ExpenseInput,
  DashboardStats,
} from "@/types";
import type { BackupResult, BackupEntry, GDriveConfig } from "@/types/electron";

const cfg = () => window.appConfig;
const base = () => `${cfg().serverUrl}`;
const isClient = () => cfg().mode === "client";

async function fetchJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const api = {
  products: {
    list: (): Promise<Product[]> =>
      isClient() ? fetchJson("GET", "/api/products") : window.electronAPI.products.list(),
    search: (q: string): Promise<Product[]> =>
      isClient() ? fetchJson("GET", `/api/products/search?q=${encodeURIComponent(q)}`) : window.electronAPI.products.search(q),
    getByBarcode: (b: string): Promise<Product | null> =>
      isClient() ? fetchJson("GET", `/api/products/barcode/${encodeURIComponent(b)}`) : window.electronAPI.products.getByBarcode(b),
    create: (p: ProductInput): Promise<Product> =>
      isClient() ? fetchJson("POST", "/api/products", p) : window.electronAPI.products.create(p),
    update: (id: string, p: ProductInput): Promise<Product> =>
      isClient() ? fetchJson("PUT", `/api/products/${id}`, p) : window.electronAPI.products.update(id, p),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/products/${id}`) : window.electronAPI.products.delete(id),
    archive: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/products/${id}`) : window.electronAPI.products.archive(id),
    restore: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("POST", `/api/products/${id}/restore`) : window.electronAPI.products.restore(id),
    listAll: (): Promise<Product[]> =>
      isClient() ? fetchJson("GET", "/api/products?includeArchived=true") : window.electronAPI.products.listAll(),
  },
  sales: {
    create: (s: SaleInput): Promise<Sale> =>
      isClient() ? fetchJson("POST", "/api/sales", s) : window.electronAPI.sales.create(s),
    listRecent: (l = 10): Promise<Sale[]> =>
      isClient() ? fetchJson("GET", `/api/sales/recent?limit=${l}`) : window.electronAPI.sales.listRecent(l),
    getById: (id: string): Promise<Sale | null> =>
      isClient() ? fetchJson("GET", `/api/sales/${id}`) : window.electronAPI.sales.getById(id),
    listByDate: (dateStr: string): Promise<Sale[]> =>
      isClient() ? fetchJson("GET", `/api/sales/date/${dateStr}`) : window.electronAPI.sales.listByDate(dateStr),
    listAll: (opts?: { search?: string; dateFrom?: string; dateTo?: string }): Promise<Sale[]> => {
      const params = opts ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(opts).filter(([_, v]) => v))).toString() : "";
      return isClient() ? fetchJson("GET", `/api/sales${params}`) : window.electronAPI.sales.listAll(opts);
    },
  },
  customers: {
    list: (): Promise<Customer[]> =>
      isClient() ? fetchJson("GET", "/api/customers") : window.electronAPI.customers.list(),
    search: (q: string): Promise<Customer[]> =>
      isClient() ? fetchJson("GET", `/api/customers/search?q=${encodeURIComponent(q)}`) : window.electronAPI.customers.search(q),
    create: (c: CustomerInput): Promise<Customer> =>
      isClient() ? fetchJson("POST", "/api/customers", c) : window.electronAPI.customers.create(c),
    update: (id: string, c: CustomerInput): Promise<Customer> =>
      isClient() ? fetchJson("PUT", `/api/customers/${id}`, c) : window.electronAPI.customers.update(id, c),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/customers/${id}`) : window.electronAPI.customers.delete(id),
    getById: (id: string): Promise<Customer | null> =>
      isClient() ? fetchJson("GET", `/api/customers/${id}`) : window.electronAPI.customers.getById(id),
  },
  arrears: {
    list: (status?: string): Promise<Arrear[]> =>
      isClient() ? fetchJson("GET", `/api/arrears${status ? `?status=${status}` : ""}`) : window.electronAPI.arrears.list(status),
    create: (a: ArrearInput): Promise<Arrear> =>
      isClient() ? fetchJson("POST", "/api/arrears", a) : window.electronAPI.arrears.create(a),
    recordPayment: (id: string, amount: number): Promise<Arrear> =>
      isClient() ? fetchJson("POST", `/api/arrears/${id}/pay`, { amount }) : window.electronAPI.arrears.recordPayment(id, amount),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/arrears/${id}`) : window.electronAPI.arrears.delete(id),
    settle: (id: string): Promise<Arrear> =>
      isClient() ? fetchJson("POST", `/api/arrears/${id}/settle`) : window.electronAPI.arrears.settle(id),
  },
  stock: {
    list: (): Promise<StockPurchase[]> =>
      isClient() ? fetchJson("GET", "/api/stock") : window.electronAPI.stock.list(),
    create: (p: StockInput): Promise<StockPurchase> =>
      isClient() ? fetchJson("POST", "/api/stock", p) : window.electronAPI.stock.create(p),
    update: (id: string, p: StockInput): Promise<StockPurchase> =>
      isClient() ? fetchJson("PUT", `/api/stock/${id}`, p) : window.electronAPI.stock.update(id, p),
  },
  distributors: {
    list: (): Promise<Distributor[]> =>
      isClient() ? fetchJson("GET", "/api/distributors") : window.electronAPI.distributors.list(),
    create: (d: DistributorInput): Promise<Distributor> =>
      isClient() ? fetchJson("POST", "/api/distributors", d) : window.electronAPI.distributors.create(d),
    update: (id: string, d: DistributorInput): Promise<Distributor> =>
      isClient() ? fetchJson("PUT", `/api/distributors/${id}`, d) : window.electronAPI.distributors.update(id, d),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/distributors/${id}`) : window.electronAPI.distributors.delete(id),
  },
  companies: {
    list: (): Promise<Company[]> =>
      isClient() ? fetchJson("GET", "/api/companies") : window.electronAPI.companies.list(),
    create: (c: CompanyInput): Promise<Company> =>
      isClient() ? fetchJson("POST", "/api/companies", c) : window.electronAPI.companies.create(c),
    update: (id: string, c: CompanyInput): Promise<Company> =>
      isClient() ? fetchJson("PUT", `/api/companies/${id}`, c) : window.electronAPI.companies.update(id, c),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/companies/${id}`) : window.electronAPI.companies.delete(id),
  },
  returns: {
    list: (): Promise<ReturnEntry[]> =>
      isClient() ? fetchJson("GET", "/api/returns") : window.electronAPI.returns.list(),
    create: (r: ReturnInput): Promise<ReturnEntry> =>
      isClient() ? fetchJson("POST", "/api/returns", r) : window.electronAPI.returns.create(r),
  },
  expenses: {
    list: (): Promise<Expense[]> =>
      isClient() ? fetchJson("GET", "/api/expenses") : window.electronAPI.expenses.list(),
    create: (e: ExpenseInput): Promise<Expense> =>
      isClient() ? fetchJson("POST", "/api/expenses", e) : window.electronAPI.expenses.create(e),
    update: (id: string, e: ExpenseInput): Promise<Expense> =>
      isClient() ? fetchJson("PUT", `/api/expenses/${id}`, e) : window.electronAPI.expenses.update(id, e),
    delete: (id: string): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("DELETE", `/api/expenses/${id}`) : window.electronAPI.expenses.delete(id),
  },
  auth: {
    verifyPassword: (password: string): Promise<{ valid: boolean }> =>
      isClient() ? fetchJson("POST", "/api/auth/verify-password", { password }) : window.verifyAdminPassword(password),
  },
  dashboard: {
    stats: (): Promise<DashboardStats> =>
      isClient() ? fetchJson("GET", "/api/dashboard/stats") : window.electronAPI.dashboard.stats(),
  },
  settings: {
    backupCreate: (): Promise<BackupResult> =>
      isClient() ? fetchJson("POST", "/api/settings/backup") : window.electronAPI.settings.backupCreate(),
    backupList: (): Promise<BackupEntry[]> =>
      isClient() ? fetchJson("GET", "/api/settings/backups") : window.electronAPI.settings.backupList(),
    backupDelete: (name: string): Promise<{ success: boolean; error?: string }> =>
      isClient() ? fetchJson("DELETE", "/api/settings/backup", { name }) : window.electronAPI.settings.backupDelete(name),
    gdriveGetConfig: (): Promise<GDriveConfig> =>
      isClient() ? fetchJson("GET", "/api/settings/gdrive") : window.electronAPI.settings.gdriveGetConfig(),
    gdriveSaveConfig: (cfg: GDriveConfig): Promise<{ success: boolean }> =>
      isClient() ? fetchJson("PUT", "/api/settings/gdrive", cfg) : window.electronAPI.settings.gdriveSaveConfig(cfg),
  },
};

export { api };
