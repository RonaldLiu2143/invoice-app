import type { Customer, Invoice, CompanySettings } from "./types";
import { calculateTotals, formatCurrency, formatDate } from "./calculations";

export function buildInvoiceEmailBody(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): string {
  const totals = calculateTotals(invoice.lineItems, invoice.taxRate);
  const lines = invoice.lineItems
    .map(
      (item) =>
        `  - ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)}`
    )
    .join("\n");

  return [
    `Dear ${customer.name},`,
    "",
    `Please find your invoice #${invoice.invoiceNumber} from ${settings.name}.`,
    "",
    `Issue Date: ${formatDate(invoice.issueDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    `Status: ${invoice.status}`,
    "",
    "Items:",
    lines,
    "",
    `Subtotal: ${formatCurrency(totals.subtotal)}`,
    `Tax (${invoice.taxRate}%): ${formatCurrency(totals.tax)}`,
    `Total: ${formatCurrency(totals.total)}`,
    "",
    invoice.notes ? `Notes: ${invoice.notes}` : "",
    "",
    "Thank you for your business!",
    settings.name,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getMailtoLink(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): string {
  const subject = encodeURIComponent(
    `Invoice #${invoice.invoiceNumber} from ${settings.name}`
  );
  const body = encodeURIComponent(
    buildInvoiceEmailBody(invoice, customer, settings)
  );
  const to = encodeURIComponent(customer.email || "");
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export async function shareInvoice(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): Promise<boolean> {
  const text = buildInvoiceEmailBody(invoice, customer, settings);
  const title = `Invoice #${invoice.invoiceNumber}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
