import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Customer, Invoice, CompanySettings } from "./types";
import { calculateTotals, formatCurrency, formatDate, lineItemTotal } from "./calculations";

export function generateInvoicePDF(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): jsPDF {
  const doc = new jsPDF();
  const totals = calculateTotals(invoice.lineItems, invoice.taxRate);

  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138);
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(settings.name, 14, 32);
  if (settings.email) doc.text(settings.email, 14, 37);
  if (settings.phone) doc.text(settings.phone, 14, 42);
  if (settings.address) doc.text(settings.address, 14, 47);

  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 32);
  doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 140, 37);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 42);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 47);

  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text("Bill To:", 14, 60);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(customer.name, 14, 67);
  if (customer.email) doc.text(customer.email, 14, 72);
  if (customer.phone) doc.text(customer.phone, 14, 77);
  if (customer.address) doc.text(customer.address, 14, 82);

  autoTable(doc, {
    startY: 92,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: invoice.lineItems.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(lineItemTotal(item)),
    ]),
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 10 },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatCurrency(totals.subtotal)}`, 140, finalY);
  doc.text(`Tax (${invoice.taxRate}%): ${formatCurrency(totals.tax)}`, 140, finalY + 6);
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text(`Total: ${formatCurrency(totals.total)}`, 140, finalY + 14);

  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Notes:", 14, finalY + 10);
    const splitNotes = doc.splitTextToSize(invoice.notes, 100);
    doc.text(splitNotes, 14, finalY + 16);
  }

  return doc;
}

export function downloadInvoicePDF(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): void {
  const doc = generateInvoicePDF(invoice, customer, settings);
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
