export type Customer = {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  outstandingArrear: number;
  lastPurchase: string | null;
  createdAt: string;
};

export type Product = {
  id: string;
  barcode: string;
  name: string;
  company: string;
  distributorId: string;
  salePrice: number;
  purchasePrice: number;
  stockQty: number;
  expiry: string | null;
  status: 'in-stock' | 'low-stock' | 'expired' | 'expiring-soon';
  createdAt: string;
};

export type Distributor = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  productCount: number;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  productCount: number;
  createdAt: string;
};

export type Sale = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  status: 'paid' | 'partial';
  createdAt: string;
};

export type SaleItem = {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Arrear = {
  id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  saleDate: string;
  totalBill: number;
  amountPaid: number;
  balanceDue: number;
  status: 'pending' | 'settled';
  createdAt: string;
};

export type StockPurchase = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  distributorId: string;
  distributorName: string;
  quantity: number;
  purchasePrice: number;
  expiry: string | null;
  totalValue: number;
  createdAt: string;
};

export type Return = {
  id: string;
  saleId: string;
  items: ReturnItem[];
  refundAmount: number;
  reason: string;
  createdAt: string;
};

export type ReturnItem = {
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
};

export type Expense = {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  notes: string;
  createdAt: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
};

export type StatCardData = {
  title: string;
  value: number;
  icon: string;
  trend: number;
  color: 'green' | 'amber' | 'red' | 'orange';
};

export type SaleStatus = 'paid' | 'partial';
export type ArrearStatus = 'pending' | 'settled';
export type ProductStatus = 'in-stock' | 'low-stock' | 'expired' | 'expiring-soon';
