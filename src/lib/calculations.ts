import type { Invoice, InvoiceLineItem, InvoiceStatus, InvoiceTotals } from "./types";

export function lineItemTotal(item: InvoiceLineItem): number {
  return item.quantity * item.unitPrice;
}

export function calculateTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number
): InvoiceTotals {
  const subtotal = lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function resolveInvoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "paid") return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(invoice.dueDate);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "overdue";
  return "unpaid";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
