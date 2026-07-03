export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "partial";

export type DocumentType = "invoice" | "quote";

export type DiscountType = "percent" | "fixed";

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export type InvoiceTemplateId =
  | "classic"
  | "modern"
  | "bold"
  | "elegant"
  | "minimal";

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
  serialNumber?: string;
  createdAt: string;
}

export type LineItemPriceMode = "unit" | "flat";

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  priceMode?: LineItemPriceMode;
  serialNumber?: string;
}

export interface JobPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  serialNumber: string;
  showSerialNumber: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  documentType: DocumentType;
  customerId: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  discountType?: DiscountType;
  discountValue?: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  jobReference?: string;
  notes: string;
  terms?: string;
  templateId?: InvoiceTemplateId;
  payments: Payment[];
  jobPhotos?: JobPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days60plus: number;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
  templateId: InvoiceTemplateId;
  logoDataUrl?: string;
  defaultTerms?: string;
  defaultNotes?: string;
}

export interface AppData {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  settings: CompanySettings;
  nextInvoiceNumber: number;
}
