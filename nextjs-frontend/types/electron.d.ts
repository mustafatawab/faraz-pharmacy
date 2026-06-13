import type {
  Product,
  Sale,
  SaleItem,
  Customer,
  Arrear,
  StockPurchase,
  Distributor,
  Company,
  Return,
  ReturnItem,
  Expense,
} from "./index";

export interface ProductFormData {
  barcode: string;
  name: string;
  company: string;
  distributorId?: string;
  salePrice: number;
  purchasePrice: number;
  stockQty: number;
  expiry?: string | null;
}

export interface SaleFormData {
  customerId?: string | null;
  items: {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
}

export interface DistributorFormData {
  name: string;
  contact: string;
  phone: string;
  address?: string;
}

export interface CompanyFormData {
  name: string;
  contact: string;
  phone: string;
  address?: string;
}

export interface StockPurchaseFormData {
  productId: string;
  distributorId?: string;
  quantity: number;
  purchasePrice: number;
  expiry?: string | null;
}

export interface ReturnFormData {
  saleId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    refundAmount: number;
  }[];
  refundAmount: number;
  reason: string;
}

export interface ExpenseFormData {
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
}

export interface CustomerDetail extends Customer {
  purchases: Sale[];
  arrears: Arrear[];
}

export interface DashboardStats {
  todayRevenue: number;
  totalArrears: number;
  lowStockCount: number;
  expiringSoonCount: number;
  weekRevenue: { day: string; revenue: number }[];
  topProducts: { name: string; value: number }[];
}

export interface ElectronAPI {
  products: {
    list: () => Promise<Product[]>;
    search: (query: string) => Promise<Product[]>;
    getByBarcode: (barcode: string) => Promise<Product | null>;
    create: (product: ProductFormData) => Promise<Product>;
    update: (id: string, product: ProductFormData) => Promise<Product>;
    delete: (id: string) => Promise<{ success: boolean }>;
  };
  sales: {
    create: (sale: SaleFormData) => Promise<Sale>;
    listRecent: (limit?: number) => Promise<Sale[]>;
    getById: (id: string) => Promise<SaleDetail | null>;
  };
  customers: {
    list: () => Promise<Customer[]>;
    search: (query: string) => Promise<Customer[]>;
    create: (customer: CustomerFormData) => Promise<Customer>;
    getById: (id: string) => Promise<CustomerDetail | null>;
  };
  arrears: {
    list: (status?: string) => Promise<Arrear[]>;
    recordPayment: (id: string, amount: number) => Promise<Arrear>;
  };
  stock: {
    list: () => Promise<StockPurchase[]>;
    create: (purchase: StockPurchaseFormData) => Promise<StockPurchase>;
  };
  distributors: {
    list: () => Promise<Distributor[]>;
    create: (distributor: DistributorFormData) => Promise<Distributor>;
  };
  companies: {
    list: () => Promise<Company[]>;
    create: (company: CompanyFormData) => Promise<Company>;
  };
  returns: {
    list: () => Promise<Return[]>;
    create: (returnData: ReturnFormData) => Promise<Return>;
  };
  expenses: {
    list: () => Promise<Expense[]>;
    create: (expense: ExpenseFormData) => Promise<Expense>;
  };
  dashboard: {
    stats: () => Promise<DashboardStats>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
