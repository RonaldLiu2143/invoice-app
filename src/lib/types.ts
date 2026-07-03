export type InvoiceStatus = "paid" | "unpaid" | "overdue";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
}

export interface AppData {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  settings: CompanySettings;
  nextInvoiceNumber: number;
}
