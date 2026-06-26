export const PRODUCT_CATEGORIES = [
  "Tablets", "Capsules", "Syrups", "Injections",
  "Creams", "Drops", "Inhalers", "Other",
] as const;

export interface Product {
  id: string;
  barcode: string;
  name: string;
  company: string;
  category: string;
  location: string;
  distributor_id?: string;
  sale_price: number;
  purchase_price: number;
  markup_percent: number;
  stock_qty: number;
  expiry?: string;
  active: number;
  created_at: string;
}

export interface ProductInput {
  barcode: string;
  name: string;
  distributorId?: string;
  salePrice?: number;
  purchasePrice: number;
  markupPercent?: number;
  category?: string;
  location?: string;
  expiry?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  total_purchases?: number;
  outstanding_arrear?: number;
  last_purchase?: string;
  purchases?: Sale[];
  arrears?: Arrear[];
}

export interface CustomerInput {
  name: string;
  phone?: string;
  address?: string;
}

export interface Sale {
  id: string;
  customer_id?: string;
  customer_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  change: number;
  status: string;
  created_at: string;
  return_count?: number;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleInput {
  customerId?: string;
  customerName?: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  items: SaleItemInput[];
}

export interface SaleItemInput {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Arrear {
  id: string;
  sale_id: string;
  customer_id: string;
  customer_name?: string;
  total_bill: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  created_at: string;
}

export interface ArrearInput {
  customerId: string;
  totalBill: number;
  amountPaid?: number;
  saleId?: string;
}

export interface StockPurchase {
  id: string;
  product_id: string;
  product_name?: string;
  distributor_id?: string;
  distributor_name?: string;
  company_id?: string;
  company_name?: string;
  invoice_number: string;
  quantity: number;
  purchase_price: number;
  expiry?: string;
  total_value: number;
  created_at: string;
}

export interface StockInput {
  productId: string;
  distributorId?: string;
  companyId?: string;
  invoiceNumber?: string;
  purchasePrice?: number;
  quantity: number;
  expiry?: string;
}

export interface Distributor {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  company_id?: string;
  company_name?: string;
  created_at: string;
  product_count?: number;
}

export interface DistributorInput {
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  second_number: string;
  created_at: string;
  product_count?: number;
}

export interface CompanyInput {
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  second_number?: string;
}

export interface ReturnEntry {
  id: string;
  sale_id: string;
  refund_amount: number;
  reason: string;
  created_at: string;
}

export interface ReturnItemInput {
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
}

export interface ReturnInput {
  saleId: string;
  refundAmount: number;
  reason: string;
  items: ReturnItemInput[];
}

export interface ReturnResult extends Omit<ReturnEntry, "reason"> {
  items?: ReturnItemInput[];
  reason?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes: string;
  date: string;
  created_at: string;
}

export interface ExpenseInput {
  title: string;
  category: string;
  amount: number;
  notes?: string;
  date: string;
}

export type DiscountType = "pkr" | "percent";

export interface PrinterConfig {
  paperSize: "thermal" | "a4" | "a5";
  deviceName: string | null;
}

export interface DashboardStats {
  todayRevenue: number;
  totalArrears: number;
  lowStockCount: number;
  expiringSoonCount: number;
  weekRevenue: { day: string; revenue: number }[];
  topProducts: { name: string; value: number }[];
}
