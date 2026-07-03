import type { Customer, Invoice, InvoiceStatus, InvoiceTotals, CompanySettings } from "@/lib/types";

export interface InvoiceTemplateProps {
  invoice: Invoice;
  customer: Customer;
  settings: CompanySettings;
  status: InvoiceStatus;
  totals: InvoiceTotals;
  compact?: boolean;
}
