import type {
  AgingBuckets,
  DiscountType,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceTotals,
} from "./types";

const PAID_TOLERANCE = 0.005;
export const PAYMENT_TOLERANCE = PAID_TOLERANCE;

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function dueDateFromIssue(issueDate: string, days = 30): string {
  const d = parseLocalDate(issueDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isFlatPriceItem(item: InvoiceLineItem): boolean {
  return item.priceMode === "flat";
}

export function lineItemTotal(item: InvoiceLineItem): number {
  if (isFlatPriceItem(item)) return item.unitPrice;
  return item.quantity * item.unitPrice;
}

export function computeDiscountAmount(
  subtotal: number,
  discountType?: DiscountType,
  discountValue?: number
): number {
  if (!discountType || !discountValue || discountValue <= 0 || subtotal <= 0) {
    return 0;
  }
  if (discountType === "percent") {
    return Math.min(subtotal, subtotal * (discountValue / 100));
  }
  return Math.min(subtotal, discountValue);
}

export function calculateTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number,
  discount?: { type?: DiscountType; value?: number }
): InvoiceTotals {
  const subtotal = lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
  const discountAmount = computeDiscountAmount(
    subtotal,
    discount?.type,
    discount?.value
  );
  const taxable = subtotal - discountAmount;
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;
  return { subtotal, discount: discountAmount, tax, total };
}

export function calculateInvoiceTotals(invoice: Invoice): InvoiceTotals {
  return calculateTotals(invoice.lineItems, invoice.taxRate, {
    type: invoice.discountType,
    value: invoice.discountValue,
  });
}

export function getAmountPaid(invoice: Invoice): number {
  const payments = invoice.payments ?? [];
  if (payments.length > 0) {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }
  if (invoice.status === "paid") {
    return calculateInvoiceTotals(invoice).total;
  }
  return 0;
}

export function getBalanceDue(invoice: Invoice): number {
  const { total } = calculateInvoiceTotals(invoice);
  return Math.max(0, total - getAmountPaid(invoice));
}

export function resolveInvoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.documentType === "quote") return "unpaid";

  const { total } = calculateInvoiceTotals(invoice);
  const paid = getAmountPaid(invoice);
  const balance = total - paid;

  if (balance <= PAID_TOLERANCE) return "paid";

  const today = parseLocalDate(todayISO());
  const due = parseLocalDate(invoice.dueDate);
  const isPastDue = due < today || invoice.status === "overdue";

  if (isPastDue && balance > PAID_TOLERANCE) return "overdue";
  if (paid > PAID_TOLERANCE) return "partial";
  if (isPastDue) return "overdue";
  return "unpaid";
}

export function getAgingBuckets(invoices: Invoice[]): AgingBuckets {
  const buckets: AgingBuckets = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days60plus: 0,
  };

  const today = parseLocalDate(todayISO());

  for (const invoice of invoices) {
    if (invoice.documentType === "quote") continue;
    const balance = getBalanceDue(invoice);
    if (balance <= PAID_TOLERANCE) continue;

    const due = parseLocalDate(invoice.dueDate);
    const daysPastDue = Math.floor(
      (today.getTime() - due.getTime()) / 86_400_000
    );

    if (daysPastDue <= 0) buckets.current += balance;
    else if (daysPastDue <= 30) buckets.days1to30 += balance;
    else if (daysPastDue <= 60) buckets.days31to60 += balance;
    else buckets.days60plus += balance;
  }

  return buckets;
}

export function isQuote(invoice: Invoice): boolean {
  return invoice.documentType === "quote";
}

export function documentLabel(invoice: Invoice): string {
  return isQuote(invoice) ? "Quote" : "Invoice";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
