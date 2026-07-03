import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Customer, Invoice, CompanySettings, InvoiceTemplateId } from "./types";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  lineItemTotal,
} from "./calculations";
import { getTemplateMeta, resolveTemplateId } from "./templates";

type Doc = jsPDF;

interface PdfContext {
  invoice: Invoice;
  customer: Customer;
  settings: CompanySettings;
  templateId: InvoiceTemplateId;
}

function drawLineItems(
  doc: Doc,
  ctx: PdfContext,
  startY: number,
  headFill: [number, number, number],
  headText: [number, number, number] = [255, 255, 255]
) {
  autoTable(doc, {
    startY,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: ctx.invoice.lineItems.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(lineItemTotal(item)),
    ]),
    headStyles: { fillColor: headFill, textColor: headText },
    styles: { fontSize: 10 },
  });
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function drawTotals(doc: Doc, ctx: PdfContext, startY: number, accent: [number, number, number]) {
  const totals = calculateTotals(ctx.invoice.lineItems, ctx.invoice.taxRate);
  let y = startY + 10;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal: ${formatCurrency(totals.subtotal)}`, 140, y);
  doc.text(`Tax (${ctx.invoice.taxRate}%): ${formatCurrency(totals.tax)}`, 140, y + 6);
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text(`Total: ${formatCurrency(totals.total)}`, 140, y + 14);
  if (ctx.invoice.notes) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Notes:", 14, y + 10);
    doc.text(doc.splitTextToSize(ctx.invoice.notes, 100), 14, y + 16);
  }
}

function drawAddresses(doc: Doc, ctx: PdfContext, startY: number) {
  doc.setFontSize(11);
  doc.setTextColor(...getTemplateMeta(ctx.templateId).theme.primary);
  doc.text("Bill To:", 14, startY);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  let y = startY + 7;
  doc.text(ctx.customer.name, 14, y);
  if (ctx.customer.email) doc.text(ctx.customer.email, 14, (y += 5));
  if (ctx.customer.phone) doc.text(ctx.customer.phone, 14, (y += 5));
  if (ctx.customer.address) doc.text(ctx.customer.address, 14, (y += 5));
}

function pdfClassic(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  doc.setFontSize(22);
  doc.setTextColor(...theme.primary);
  doc.text("INVOICE", 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(ctx.settings.name, 14, 32);
  if (ctx.settings.email) doc.text(ctx.settings.email, 14, 37);
  if (ctx.settings.phone) doc.text(ctx.settings.phone, 14, 42);
  if (ctx.settings.address) doc.text(ctx.settings.address, 14, 47);
  doc.text(`Invoice #: ${ctx.invoice.invoiceNumber}`, 140, 32);
  doc.text(`Issue Date: ${formatDate(ctx.invoice.issueDate)}`, 140, 37);
  doc.text(`Due Date: ${formatDate(ctx.invoice.dueDate)}`, 140, 42);
  doc.text(`Status: ${ctx.invoice.status.toUpperCase()}`, 140, 47);
  drawAddresses(doc, ctx, 60);
  const finalY = drawLineItems(doc, ctx, 92, theme.primary);
  drawTotals(doc, ctx, finalY, theme.primary);
}

function pdfModern(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  doc.setFillColor(...(theme.headerFill ?? [238, 242, 255]));
  doc.rect(0, 0, 210, 40, "F");
  doc.setFontSize(18);
  doc.setTextColor(...theme.primary);
  doc.text(ctx.settings.name, 14, 18);
  doc.setFontSize(11);
  doc.text(`Invoice #${ctx.invoice.invoiceNumber}`, 14, 28);
  doc.setTextColor(100, 116, 139);
  doc.text(formatDate(ctx.invoice.issueDate), 140, 18);
  doc.text(`Due ${formatDate(ctx.invoice.dueDate)}`, 140, 26);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("From:", 14, 50);
  doc.text(ctx.settings.name, 14, 57);
  doc.text("Bill To:", 110, 50);
  doc.text(ctx.customer.name, 110, 57);
  const finalY = drawLineItems(doc, ctx, 72, theme.primary, [255, 255, 255]);
  drawTotals(doc, ctx, finalY, theme.primary);
}

function pdfBold(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  doc.setFillColor(...(theme.headerFill ?? theme.primary));
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("INVOICE", 14, 22);
  doc.setFontSize(12);
  doc.text(`#${ctx.invoice.invoiceNumber}`, 160, 22);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(ctx.settings.name, 14, 48);
  doc.text(ctx.customer.name, 110, 48);
  doc.text(`Status: ${ctx.invoice.status}`, 14, 58);
  const finalY = drawLineItems(doc, ctx, 68, theme.primary);
  drawTotals(doc, ctx, finalY, theme.primary);
}

function pdfElegant(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, 190, 277);
  doc.setFontSize(16);
  doc.setTextColor(...theme.primary);
  doc.text(ctx.settings.name, 20, 28);
  doc.setFontSize(10);
  doc.setTextColor(120, 113, 108);
  doc.text("Invoice", 20, 36);
  doc.text(`No. ${ctx.invoice.invoiceNumber}`, 150, 28);
  doc.text(formatDate(ctx.invoice.issueDate), 150, 36);
  doc.setTextColor(60, 60, 60);
  doc.text("Sender", 20, 52);
  doc.text(ctx.settings.name, 20, 59);
  doc.text("Recipient", 110, 52);
  doc.text(ctx.customer.name, 110, 59);
  const finalY = drawLineItems(doc, ctx, 72, theme.accent, [255, 255, 255]);
  drawTotals(doc, ctx, finalY, theme.primary);
}

function pdfMinimal(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(14, 20, 196, 20);
  doc.setFontSize(14);
  doc.setTextColor(...theme.text);
  doc.text("INVOICE", 14, 16);
  doc.setFontSize(10);
  doc.text(`#${ctx.invoice.invoiceNumber}`, 170, 16);
  doc.setTextColor(115, 115, 115);
  doc.text(ctx.settings.name, 14, 32);
  doc.text(ctx.customer.name, 80, 32);
  doc.text(formatDate(ctx.invoice.dueDate), 150, 32);
  const finalY = drawLineItems(doc, ctx, 42, [255, 255, 255], theme.text);
  doc.setDrawColor(0, 0, 0);
  doc.line(14, 42, 196, 42);
  drawTotals(doc, ctx, finalY, theme.text);
}

const PDF_RENDERERS: Record<InvoiceTemplateId, (doc: Doc, ctx: PdfContext) => void> = {
  classic: pdfClassic,
  modern: pdfModern,
  bold: pdfBold,
  elegant: pdfElegant,
  minimal: pdfMinimal,
};

export function generateInvoicePDF(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): jsPDF {
  const doc = new jsPDF();
  const templateId = resolveTemplateId(invoice, settings);
  const ctx: PdfContext = { invoice, customer, settings, templateId };
  PDF_RENDERERS[templateId](doc, ctx);
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
