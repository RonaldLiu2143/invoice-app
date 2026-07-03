import type { Invoice, InvoiceLineItem, InvoiceStatus, InvoiceTotals } from "./types";

const PAID_TOLERANCE = 0.005;

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

export function getAmountPaid(invoice: Invoice): number {
  const payments = invoice.payments ?? [];
  if (payments.length > 0) {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }
  if (invoice.status === "paid") {
    return calculateTotals(invoice.lineItems, invoice.taxRate).total;
  }
  return 0;
}

export function getBalanceDue(invoice: Invoice): number {
  const { total } = calculateTotals(invoice.lineItems, invoice.taxRate);
  return Math.max(0, total - getAmountPaid(invoice));
}

export function resolveInvoiceStatus(invoice: Invoice): InvoiceStatus {
  const { total } = calculateTotals(invoice.lineItems, invoice.taxRate);
  const paid = getAmountPaid(invoice);
  const balance = total - paid;

  if (balance <= PAID_TOLERANCE) return "paid";
  if (paid > PAID_TOLERANCE) return "partial";

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
