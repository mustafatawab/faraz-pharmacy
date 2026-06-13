import type { Product, Customer, Sale, Arrear, StockPurchase, Distributor, Company, Return, Expense } from "@/types";
import type {
  ProductFormData,
  SaleFormData,
  CustomerFormData,
  DistributorFormData,
  CompanyFormData,
  StockPurchaseFormData,
  ReturnFormData,
  ExpenseFormData,
  DashboardStats,
  CustomerDetail,
  SaleDetail,
} from "@/types/electron";

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

// ── Mock Data (fallback when not in Electron) ──
const mockProducts: Product[] = [
  { id: "p1", barcode: "8901234567890", name: "Amoxicillin 500mg", company: "GSK", distributorId: "d1", salePrice: 120, purchasePrice: 80, stockQty: 45, expiry: "2026-12-31", status: "in-stock", createdAt: "2026-01-15" },
  { id: "p2", barcode: "8901234567891", name: "Paracetamol 500mg", company: "Pfizer", distributorId: "d1", salePrice: 50, purchasePrice: 30, stockQty: 120, expiry: "2027-06-30", status: "in-stock", createdAt: "2026-02-10" },
  { id: "p3", barcode: "8901234567892", name: "Omeprazole 20mg", company: "Abbott", distributorId: "d2", salePrice: 85, purchasePrice: 55, stockQty: 3, expiry: "2026-09-15", status: "low-stock", createdAt: "2026-01-20" },
  { id: "p4", barcode: "8901234567893", name: "Atorvastatin 10mg", company: "Pfizer", distributorId: "d1", salePrice: 150, purchasePrice: 100, stockQty: 28, expiry: "2027-03-20", status: "in-stock", createdAt: "2026-03-05" },
  { id: "p5", barcode: "8901234567894", name: "Metformin 500mg", company: "Sanofi", distributorId: "d3", salePrice: 60, purchasePrice: 35, stockQty: 67, expiry: "2026-11-30", status: "in-stock", createdAt: "2026-02-28" },
  { id: "p6", barcode: "8901234567895", name: "Losartan 50mg", company: "MSD", distributorId: "d2", salePrice: 95, purchasePrice: 65, stockQty: 15, expiry: "2026-07-31", status: "in-stock", createdAt: "2026-01-10" },
  { id: "p7", barcode: "8901234567896", name: "Aspirin 75mg", company: "Bayer", distributorId: "d3", salePrice: 30, purchasePrice: 18, stockQty: 200, expiry: "2028-01-15", status: "in-stock", createdAt: "2026-04-01" },
  { id: "p8", barcode: "8901234567897", name: "Salbutamol Inhaler", company: "GSK", distributorId: "d1", salePrice: 350, purchasePrice: 250, stockQty: 0, expiry: "2026-05-10", status: "expired", createdAt: "2025-06-15" },
];

const mockCustomers: Customer[] = [
  { id: "c1", name: "Ahmed Khan", phone: "0300-1234567", totalPurchases: 15, outstandingArrear: 200, lastPurchase: "2026-06-02", createdAt: "2026-01-10" },
  { id: "c2", name: "Fatima Ali", phone: "0301-2345678", totalPurchases: 8, outstandingArrear: 0, lastPurchase: "2026-06-01", createdAt: "2026-02-15" },
  { id: "c3", name: "Usman Raza", phone: "0302-3456789", totalPurchases: 22, outstandingArrear: 1100, lastPurchase: "2026-05-30", createdAt: "2025-11-20" },
  { id: "c4", name: "Sara Mahmood", phone: "0303-4567890", totalPurchases: 5, outstandingArrear: 0, lastPurchase: "2026-05-28", createdAt: "2026-03-01" },
];

function delay(ms = 100) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── API Layer ──
export const api = {
  // Products
  products: {
    list: async (): Promise<Product[]> => {
      if (isElectron) return window.electronAPI!.products.list();
      await delay();
      return mockProducts;
    },
    search: async (query: string): Promise<Product[]> => {
      if (isElectron) return window.electronAPI!.products.search(query);
      await delay();
      const q = query.toLowerCase();
      return mockProducts.filter(
        (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
      );
    },
    getByBarcode: async (barcode: string): Promise<Product | null> => {
      if (isElectron) return window.electronAPI!.products.getByBarcode(barcode);
      await delay();
      return mockProducts.find((p) => p.barcode === barcode) || null;
    },
    create: async (data: ProductFormData): Promise<Product> => {
      if (isElectron) return window.electronAPI!.products.create(data);
      const product: Product = {
        id: `p${Date.now()}`,
        ...data,
        distributorId: data.distributorId || "",
        expiry: data.expiry || null,
        status: "in-stock",
        createdAt: new Date().toISOString(),
      };
      mockProducts.push(product);
      await delay();
      return product;
    },
    update: async (id: string, data: ProductFormData): Promise<Product> => {
      if (isElectron) return window.electronAPI!.products.update(id, data);
      const idx = mockProducts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Product not found");
      mockProducts[idx] = { ...mockProducts[idx], ...data, expiry: data.expiry || null };
      await delay();
      return mockProducts[idx];
    },
    delete: async (id: string) => {
      if (isElectron) return window.electronAPI!.products.delete(id);
      const idx = mockProducts.findIndex((p) => p.id === id);
      if (idx !== -1) mockProducts.splice(idx, 1);
      await delay();
      return { success: true };
    },
  },

  // Sales
  sales: {
    create: async (data: SaleFormData): Promise<Sale> => {
      if (isElectron) return window.electronAPI!.sales.create(data);
      await delay();
      return {
        id: `s${Date.now()}`,
        customerId: data.customerId || null,
        customerName: null,
        items: [],
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        amountPaid: data.amountPaid,
        change: Math.max(0, data.amountPaid - data.total),
        status: data.amountPaid >= data.total ? "paid" : "partial",
        createdAt: new Date().toISOString(),
      };
    },
    listRecent: async (limit = 10): Promise<Sale[]> => {
      if (isElectron) return window.electronAPI!.sales.listRecent(limit);
      await delay();
      return [];
    },
    getById: async (id: string): Promise<SaleDetail | null> => {
      if (isElectron) return window.electronAPI!.sales.getById(id);
      await delay();
      return null;
    },
  },

  // Customers
  customers: {
    list: async (): Promise<Customer[]> => {
      if (isElectron) return window.electronAPI!.customers.list();
      await delay();
      return mockCustomers;
    },
    search: async (query: string): Promise<Customer[]> => {
      if (isElectron) return window.electronAPI!.customers.search(query);
      await delay();
      const q = query.toLowerCase();
      return mockCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    },
    create: async (data: CustomerFormData): Promise<Customer> => {
      if (isElectron) return window.electronAPI!.customers.create(data);
      const customer: Customer = {
        id: `c${Date.now()}`,
        name: data.name,
        phone: data.phone,
        totalPurchases: 0,
        outstandingArrear: 0,
        lastPurchase: null,
        createdAt: new Date().toISOString(),
      };
      mockCustomers.push(customer);
      await delay();
      return customer;
    },
    getById: async (id: string): Promise<CustomerDetail | null> => {
      if (isElectron) return window.electronAPI!.customers.getById(id);
      await delay();
      return null;
    },
  },

  // Arrears
  arrears: {
    list: async (status?: string): Promise<Arrear[]> => {
      if (isElectron) return window.electronAPI!.arrears.list(status);
      await delay();
      return [];
    },
    recordPayment: async (id: string, amount: number): Promise<Arrear> => {
      if (isElectron) return window.electronAPI!.arrears.recordPayment(id, amount);
      await delay();
      throw new Error("Not available in browser mode");
    },
  },

  // Stock
  stock: {
    list: async (): Promise<StockPurchase[]> => {
      if (isElectron) return window.electronAPI!.stock.list();
      await delay();
      return [];
    },
    create: async (data: StockPurchaseFormData): Promise<StockPurchase> => {
      if (isElectron) return window.electronAPI!.stock.create(data);
      await delay();
      return {
        id: `st${Date.now()}`,
        date: new Date().toISOString(),
        productId: data.productId,
        productName: "",
        distributorId: data.distributorId || "",
        distributorName: "",
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        expiry: data.expiry || null,
        totalValue: data.quantity * data.purchasePrice,
        createdAt: new Date().toISOString(),
      };
    },
  },

  // Distributors
  distributors: {
    list: async (): Promise<Distributor[]> => {
      if (isElectron) return window.electronAPI!.distributors.list();
      await delay();
      return [];
    },
    create: async (data: DistributorFormData): Promise<Distributor> => {
      if (isElectron) return window.electronAPI!.distributors.create(data);
      await delay();
      return {
        id: `d${Date.now()}`,
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        address: data.address || "",
        productCount: 0,
        createdAt: new Date().toISOString(),
      };
    },
  },

  // Companies
  companies: {
    list: async (): Promise<Company[]> => {
      if (isElectron) return window.electronAPI!.companies.list();
      await delay();
      return [];
    },
    create: async (data: CompanyFormData): Promise<Company> => {
      if (isElectron) return window.electronAPI!.companies.create(data);
      await delay();
      return {
        id: `co${Date.now()}`,
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        address: data.address || "",
        productCount: 0,
        createdAt: new Date().toISOString(),
      };
    },
  },

  // Returns
  returns: {
    list: async (): Promise<Return[]> => {
      if (isElectron) return window.electronAPI!.returns.list();
      await delay();
      return [];
    },
    create: async (data: ReturnFormData): Promise<Return> => {
      if (isElectron) return window.electronAPI!.returns.create(data);
      await delay();
      return {
        id: `r${Date.now()}`,
        saleId: data.saleId,
        items: data.items,
        refundAmount: data.refundAmount,
        reason: data.reason,
        createdAt: new Date().toISOString(),
      };
    },
  },

  // Expenses
  expenses: {
    list: async (): Promise<Expense[]> => {
      if (isElectron) return window.electronAPI!.expenses.list();
      await delay();
      return [];
    },
    create: async (data: ExpenseFormData): Promise<Expense> => {
      if (isElectron) return window.electronAPI!.expenses.create(data);
      await delay();
      return {
        id: `e${Date.now()}`,
        date: data.date,
        title: data.title,
        category: data.category,
        amount: data.amount,
        notes: data.notes || "",
        createdAt: new Date().toISOString(),
      };
    },
  },

  // Dashboard
  dashboard: {
    stats: async (): Promise<DashboardStats> => {
      if (isElectron) return window.electronAPI!.dashboard.stats();
      await delay();
      return {
        todayRevenue: 132450,
        totalArrears: 45600,
        lowStockCount: 8,
        expiringSoonCount: 12,
        weekRevenue: [
          { day: "Mon", revenue: 12500 },
          { day: "Tue", revenue: 18200 },
          { day: "Wed", revenue: 15800 },
          { day: "Thu", revenue: 22100 },
          { day: "Fri", revenue: 19400 },
          { day: "Sat", revenue: 25600 },
          { day: "Sun", revenue: 18900 },
        ],
        topProducts: [
          { name: "Amoxicillin", value: 320 },
          { name: "Paracetamol", value: 280 },
          { name: "Omeprazole", value: 210 },
          { name: "Atorvastatin", value: 180 },
          { name: "Metformin", value: 150 },
        ],
      };
    },
  },
};
