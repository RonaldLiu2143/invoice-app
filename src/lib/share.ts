import type { Customer, Invoice, CompanySettings } from "./types";
import {
  calculateInvoiceTotals,
  formatCurrency,
  formatDate,
  getAmountPaid,
  getBalanceDue,
  resolveInvoiceStatus,
  documentLabel,
  isQuote,
} from "./calculations";
import { generateInvoicePDF } from "./pdf";

export function buildInvoiceEmailBody(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): string {
  const totals = calculateInvoiceTotals(invoice);
  const amountPaid = getAmountPaid(invoice);
  const balanceDue = getBalanceDue(invoice);
  const status = resolveInvoiceStatus(invoice);
  const label = documentLabel(invoice);
  const lines = invoice.lineItems
    .map((item) => {
      if (item.priceMode === "flat") {
        return `  - ${item.description}: ${formatCurrency(item.unitPrice)}`;
      }
      return `  - ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)}`;
    })
    .join("\n");

  const paymentLines =
    invoice.payments && invoice.payments.length > 0
      ? [
          "",
          "Payment history:",
          ...invoice.payments.map(
            (p) =>
              `  - ${formatDate(p.date)}: ${formatCurrency(p.amount)}${p.note ? ` (${p.note})` : ""}`
          ),
        ]
      : [];

  return [
    `Dear ${customer.name},`,
    "",
    `Please find your ${label.toLowerCase()} #${invoice.invoiceNumber} from ${settings.name}.`,
    invoice.jobReference?.trim()
      ? `Job / PO: ${invoice.jobReference.trim()}`
      : "",
    "",
    `Issue Date: ${formatDate(invoice.issueDate)}`,
    invoice.documentType === "quote"
      ? `Valid Until: ${formatDate(invoice.dueDate)}`
      : `Due Date: ${formatDate(invoice.dueDate)}`,
    `Status: ${invoice.documentType === "quote" ? "Quote" : status}`,
    "",
    "Items:",
    lines,
    "",
    `Subtotal: ${formatCurrency(totals.subtotal)}`,
    totals.discount > 0 ? `Discount: -${formatCurrency(totals.discount)}` : "",
    `Tax (${invoice.taxRate}%): ${formatCurrency(totals.tax)}`,
    `Total: ${formatCurrency(totals.total)}`,
    amountPaid > 0 && invoice.documentType !== "quote"
      ? `Balance due: ${formatCurrency(balanceDue)}`
      : "",
    ...paymentLines,
    "",
    invoice.notes ? `Notes: ${invoice.notes}` : "",
    invoice.terms ? `Terms: ${invoice.terms}` : "",
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
    `${documentLabel(invoice)} #${invoice.invoiceNumber} from ${settings.name}`
  );
  const body = encodeURIComponent(
    buildInvoiceEmailBody(invoice, customer, settings)
  );
  const to = encodeURIComponent(customer.email || "");
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

function invoicePdfFile(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): File {
  const doc = generateInvoicePDF(invoice, customer, settings);
  const blob = doc.output("blob");
  const prefix = isQuote(invoice) ? "quote" : "invoice";
  return new File([blob], `${prefix}-${invoice.invoiceNumber}.pdf`, {
    type: "application/pdf",
  });
}

export async function shareInvoice(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): Promise<ShareResult> {
  const text = buildInvoiceEmailBody(invoice, customer, settings);
  const title = `${documentLabel(invoice)} #${invoice.invoiceNumber}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const file = invoicePdfFile(invoice, customer, settings);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return "shared";
      }
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
