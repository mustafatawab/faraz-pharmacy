import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const productSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(1, "Product name is required"),
  company: z.string().min(1, "Company is required"),
  distributorId: z.string().min(1, "Distributor is required"),
  salePrice: z.coerce.number().positive("Sale price must be positive"),
  purchasePrice: z.coerce.number().positive("Purchase price must be positive"),
  stockQty: z.coerce.number().int().nonnegative("Stock quantity must be non-negative"),
  expiry: z.string().optional().nullable(),
});

export const stockPurchaseSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  distributorId: z.string().min(1, "Distributor is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  purchasePrice: z.coerce.number().positive("Purchase price must be positive"),
  expiry: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
});

export const distributorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact person is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional().default(""),
});

export const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact person is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional().default(""),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional().default(""),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const returnSchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.coerce.number().int().positive(),
    refundAmount: z.coerce.number().positive(),
  })).min(1, "At least one item is required"),
  reason: z.string().min(1, "Reason is required"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type StockPurchaseForm = z.infer<typeof stockPurchaseSchema>;
export type CustomerForm = z.infer<typeof customerSchema>;
export type DistributorForm = z.infer<typeof distributorSchema>;
export type CompanyForm = z.infer<typeof companySchema>;
export type ExpenseForm = z.infer<typeof expenseSchema>;
export type PaymentForm = z.infer<typeof paymentSchema>;
export type ReturnForm = z.infer<typeof returnSchema>;
