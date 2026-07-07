import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadBlob } from "./download";
import type {
  Customer,
  Invoice,
  CompanySettings,
  InvoiceTemplateId,
  InvoiceStatus,
  JobPhoto,
} from "./types";
import {
  calculateInvoiceTotals,
  formatCurrency,
  formatDate,
  lineItemTotal,
  getAmountPaid,
  getBalanceDue,
  isQuote,
  resolveInvoiceStatus,
} from "./calculations";
import { getTemplateMeta, resolveTemplateId } from "./templates";

type Doc = jsPDF;
type RGB = [number, number, number];

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = 280;
/** Minimum line rows so a short invoice still looks balanced on one page */
import { MIN_LINE_ITEM_ROWS } from "./invoice-layout";
const LINE_ROW_HEIGHT = 8;

const TEXT_DARK: RGB = [30, 41, 59];
const TEXT_MUTED: RGB = [100, 116, 139];
const BORDER: RGB = [203, 213, 225];
const BORDER_LIGHT: RGB = [226, 232, 240];
const FILL_LIGHT: RGB = [248, 250, 252];
const FILL_WHITE: RGB = [255, 255, 255];

interface PdfContext {
  invoice: Invoice;
  customer: Customer;
  settings: CompanySettings;
  templateId: InvoiceTemplateId;
}

const STATUS_COLORS: Record<InvoiceStatus, RGB> = {
  paid: [16, 185, 129],
  unpaid: [245, 158, 11],
  overdue: [239, 68, 68],
  partial: [14, 165, 233],
};

const tableBase = {
  margin: { left: MARGIN, right: MARGIN },
  tableWidth: CONTENT_WIDTH,
  theme: "grid" as const,
  styles: {
    fontSize: 9,
    cellPadding: 3.5,
    lineColor: BORDER_LIGHT,
    lineWidth: 0.35,
    textColor: TEXT_DARK,
    overflow: "linebreak" as const,
  },
};

function partyBlock(values: {
  name: string;
  email: string;
  phone: string;
  address: string;
}): string {
  return [
    values.name.trim() || "—",
    values.email.trim() ? `Email: ${values.email.trim()}` : "",
    values.phone.trim() ? `Phone: ${values.phone.trim()}` : "",
    values.address.trim() ? values.address.trim() : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function lineItemDescription(item: Invoice["lineItems"][number]): string {
  const lines = [item.description.trim()];
  if (item.serialNumber?.trim()) {
    lines.push(`S/N: ${item.serialNumber.trim()}`);
  }
  return lines.filter(Boolean).join("\n") || "\u00a0";
}

function lineItemRowCells(item: Invoice["lineItems"][number]): string[] {
  const amount = formatCurrency(lineItemTotal(item));
  if (item.priceMode === "flat") {
    return [
      lineItemDescription(item),
      "—",
      "Flat",
      amount,
    ];
  }
  return [
    lineItemDescription(item),
    String(item.quantity),
    formatCurrency(item.unitPrice),
    amount,
  ];
}

function lineItemRows(invoice: Invoice): string[][] {
  const rows = invoice.lineItems.map((item) => lineItemRowCells(item));

  while (rows.length < MIN_LINE_ITEM_ROWS) {
    rows.push(["\u00a0", "\u00a0", "\u00a0", "\u00a0"]);
  }
  return rows;
}

function drawPageFrame(doc: Doc, accent: RGB): void {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.roundedRect(MARGIN - 3, 10, CONTENT_WIDTH + 6, 272, 2, 2, "S");
  doc.setFillColor(...accent);
  doc.rect(MARGIN - 3, 10, CONTENT_WIDTH + 6, 3, "F");
}

function drawStatusBadge(
  doc: Doc,
  rightX: number,
  y: number,
  status: InvoiceStatus
): void {
  const label = status.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const textWidth = doc.getTextWidth(label);
  const padX = 6;
  const boxW = textWidth + padX * 2;
  const boxH = 8;
  const boxX = rightX - boxW;

  doc.setFillColor(...STATUS_COLORS[status]);
  doc.roundedRect(boxX, y, boxW, boxH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(label, boxX + padX, y + 5.5);
}

function drawHeader(doc: Doc, ctx: PdfContext, accent: RGB): number {
  const quote = isQuote(ctx.invoice);
  const title = quote ? "QUOTE" : "INVOICE";
  let y = 20;
  let titleX = MARGIN;

  if (ctx.settings.logoDataUrl) {
    try {
      doc.addImage(ctx.settings.logoDataUrl, "JPEG", MARGIN, y - 4, 28, 14);
      titleX = MARGIN + 32;
    } catch {
      // skip
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...accent);
  doc.text(title, titleX, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`#${ctx.invoice.invoiceNumber}`, titleX, y + 11);

  const rightX = MARGIN + CONTENT_WIDTH;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(ctx.settings.name, rightX, y, { align: "right" });

  if (quote) {
    doc.setFillColor(139, 92, 246);
    const label = "QUOTE";
    doc.setFontSize(8);
    const w = doc.getTextWidth(label) + 10;
    doc.roundedRect(rightX - w, y + 4, w, 7, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(label, rightX - w + 5, y + 9);
  } else {
    drawStatusBadge(doc, rightX, y + 4, resolveInvoiceStatus(ctx.invoice));
  }

  return y + 16;
}

function drawPartySection(
  doc: Doc,
  ctx: PdfContext,
  startY: number,
  accent: RGB
): number {
  autoTable(doc, {
    ...tableBase,
    startY,
    head: [["From (Company)", "Bill To (Customer)"]],
    body: [[partyBlock(ctx.settings), partyBlock(ctx.customer)]],
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: FILL_LIGHT,
      minCellHeight: 28,
      valign: "top",
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH / 2 },
      1: { cellWidth: CONTENT_WIDTH / 2 },
    },
    rowPageBreak: "avoid",
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function drawMetaSection(doc: Doc, ctx: PdfContext, startY: number): number {
  const quote = isQuote(ctx.invoice);
  const cells = [
    `Invoice #: ${ctx.invoice.invoiceNumber}`,
    `Issued: ${formatDate(ctx.invoice.issueDate)}`,
    quote
      ? `Valid until: ${formatDate(ctx.invoice.dueDate)}`
      : `Due: ${formatDate(ctx.invoice.dueDate)}`,
  ];

  autoTable(doc, {
    ...tableBase,
    startY: startY + 3,
    body: [cells],
    bodyStyles: {
      fillColor: FILL_WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      minCellHeight: 9,
      textColor: TEXT_DARK,
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH * 0.32 },
      1: { cellWidth: CONTENT_WIDTH * 0.34 },
      2: { cellWidth: CONTENT_WIDTH * 0.34 },
    },
    rowPageBreak: "avoid",
  });

  let y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;

  if (ctx.invoice.jobReference?.trim()) {
    autoTable(doc, {
      ...tableBase,
      startY: y + 1,
      body: [[`Job / PO: ${ctx.invoice.jobReference.trim()}`, "", ""]],
      bodyStyles: {
        fillColor: FILL_LIGHT,
        fontSize: 8.5,
        minCellHeight: 8,
      },
      columnStyles: {
        0: { cellWidth: CONTENT_WIDTH },
      },
      rowPageBreak: "avoid",
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;
  }

  return y;
}

function drawLineItems(
  doc: Doc,
  ctx: PdfContext,
  startY: number,
  accent: RGB
): number {
  autoTable(doc, {
    ...tableBase,
    startY: startY + 5,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: lineItemRows(ctx.invoice),
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: FILL_WHITE,
      minCellHeight: LINE_ROW_HEIGHT,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [253, 254, 255] },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH - 72 },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right", cellWidth: 29 },
      3: { halign: "right", cellWidth: 29, fontStyle: "bold" },
    },
    rowPageBreak: "avoid",
    pageBreak: "avoid",
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function drawLeftColumn(
  doc: Doc,
  ctx: PdfContext,
  startY: number
): number {
  const notes = ctx.invoice.notes.trim();
  const terms = ctx.invoice.terms?.trim();
  const payments =
    isQuote(ctx.invoice) ? [] : [...(ctx.invoice.payments ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

  const leftW = CONTENT_WIDTH * 0.56;
  const leftX = MARGIN;
  let y = startY + 6;

  const sections: { title: string; body: string }[] = [];
  if (notes) sections.push({ title: "Notes", body: notes });
  if (terms) sections.push({ title: "Terms & Conditions", body: terms });
  if (payments.length > 0) {
    sections.push({
      title: "Payment History",
      body: payments
        .map(
          (p) =>
            `${formatDate(p.date)} — ${formatCurrency(p.amount)}${p.note ? ` (${p.note})` : ""}`
        )
        .join("\n"),
    });
  }

  if (sections.length === 0) {
    doc.setFillColor(...FILL_LIGHT);
    doc.roundedRect(leftX, y, leftW, 38, 1.5, 1.5, "F");
    doc.setDrawColor(...BORDER_LIGHT);
    doc.roundedRect(leftX, y, leftW, 38, 1.5, 1.5, "S");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Thank you for your business.", leftX + 5, y + 20);
    return y + 38;
  }

  for (const section of sections) {
    const lines = doc.splitTextToSize(section.body, leftW - 10);
    const blockH = Math.min(lines.length * 3.6 + 10, 42);
    doc.setFillColor(...FILL_LIGHT);
    doc.roundedRect(leftX, y, leftW, blockH, 1.5, 1.5, "F");
    doc.setDrawColor(...BORDER_LIGHT);
    doc.roundedRect(leftX, y, leftW, blockH, 1.5, 1.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(section.title, leftX + 5, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    const maxLines = Math.min(lines.length, Math.floor((blockH - 10) / 3.6));
    doc.text(lines.slice(0, maxLines), leftX + 5, y + 11);
    y += blockH + 4;
  }

  return y;
}

function drawTotalsBlock(
  doc: Doc,
  ctx: PdfContext,
  startY: number,
  accent: RGB
): number {
  const totals = calculateInvoiceTotals(ctx.invoice);
  const amountPaid = getAmountPaid(ctx.invoice);
  const balanceDue = getBalanceDue(ctx.invoice);

  const rows: string[][] = [["Subtotal", formatCurrency(totals.subtotal)]];
  if (totals.discount > 0) {
    rows.push(["Discount", `-${formatCurrency(totals.discount)}`]);
  }
  rows.push(
    [`Tax (${ctx.invoice.taxRate}%)`, formatCurrency(totals.tax)],
    ["Total", formatCurrency(totals.total)]
  );
  if (amountPaid > 0 && !isQuote(ctx.invoice)) {
    rows.push(["Balance due", formatCurrency(balanceDue)]);
  }

  const boxW = 76;
  const boxX = MARGIN + CONTENT_WIDTH - boxW;

  autoTable(doc, {
    ...tableBase,
    startY: startY + 6,
    margin: { left: boxX, right: MARGIN },
    tableWidth: boxW,
    body: rows,
    bodyStyles: {
      fillColor: FILL_LIGHT,
      fontSize: 9,
      minCellHeight: 7,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: "right", cellWidth: 36 },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const label = rows[data.row.index]?.[0];
      if (label === "Total" || label === "Balance due") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = accent;
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    rowPageBreak: "avoid",
    pageBreak: "avoid",
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function drawJobPhotos(
  doc: Doc,
  photos: JobPhoto[],
  startY: number
): number {
  if (photos.length === 0) return startY;
  if (startY > PAGE_BOTTOM - 45) return startY;

  const shown = photos.slice(0, 3);
  const imgH = 28;
  const gap = 4;
  const colW = (CONTENT_WIDTH - gap * (shown.length - 1)) / shown.length;
  let y = startY + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Job Photos", MARGIN, y);
  y += 5;

  let x = MARGIN;
  for (const photo of shown) {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, colW, imgH + 8, 1, 1, "S");
    try {
      doc.addImage(photo.dataUrl, "JPEG", x + 1.5, y + 1.5, colW - 3, imgH);
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_MUTED);
      doc.text("Photo", x + 4, y + imgH / 2);
    }
    if (photo.caption.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...TEXT_MUTED);
      const cap = doc.splitTextToSize(photo.caption.trim(), colW - 4)[0] ?? "";
      doc.text(cap, x + 2, y + imgH + 5);
    }
    x += colW + gap;
  }

  return y + imgH + 14;
}

function drawFooter(doc: Doc, ctx: PdfContext, y: number): void {
  const contact = [ctx.settings.email, ctx.settings.phone]
    .filter((v) => v?.trim())
    .join("  ·  ");
  if (!contact) return;

  const footerY = Math.min(Math.max(y + 8, PAGE_BOTTOM - 10), PAGE_BOTTOM);
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 4, MARGIN + CONTENT_WIDTH, footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(contact, MARGIN + CONTENT_WIDTH / 2, footerY, { align: "center" });
}

function renderInvoice(doc: Doc, ctx: PdfContext, accent: RGB) {
  drawPageFrame(doc, accent);

  let y = drawHeader(doc, ctx, accent);
  y = drawPartySection(doc, ctx, y + 2, accent);
  y = drawMetaSection(doc, ctx, y);
  y = drawLineItems(doc, ctx, y, accent);

  const bottomStart = y;
  const leftEnd = drawLeftColumn(doc, ctx, bottomStart);
  const rightEnd = drawTotalsBlock(doc, ctx, bottomStart, accent);
  y = Math.max(leftEnd, rightEnd);

  y = drawJobPhotos(doc, ctx.invoice.jobPhotos ?? [], y);
  drawFooter(doc, ctx, y);
}

function pdfClassic(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  renderInvoice(doc, ctx, theme.primary);
}

function pdfModern(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  renderInvoice(doc, ctx, theme.primary);
}

function pdfBold(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  renderInvoice(doc, ctx, theme.primary);
}

function pdfElegant(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  renderInvoice(doc, ctx, theme.accent);
}

function pdfMinimal(doc: Doc, ctx: PdfContext) {
  const { theme } = getTemplateMeta(ctx.templateId);
  renderInvoice(doc, ctx, theme.text);
}

const PDF_RENDERERS: Record<
  InvoiceTemplateId,
  (doc: Doc, ctx: PdfContext) => void
> = {
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
): "downloaded" | "opened" {
  const doc = generateInvoicePDF(invoice, customer, settings);
  const prefix = isQuote(invoice) ? "quote" : "invoice";
  const blob = doc.output("blob");
  return downloadBlob(blob, `${prefix}-${invoice.invoiceNumber}.pdf`);
}

export function generateReceiptPDF(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): jsPDF {
  const doc = new jsPDF();
  const totals = calculateInvoiceTotals(invoice);
  const amountPaid = getAmountPaid(invoice);
  const payments = [...(invoice.payments ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  drawPageFrame(doc, [16, 185, 129]);

  let y = 20;
  if (settings.logoDataUrl) {
    try {
      doc.addImage(settings.logoDataUrl, "JPEG", MARGIN, y - 4, 28, 14);
    } catch {
      // skip
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129);
  doc.text("RECEIPT", MARGIN + (settings.logoDataUrl ? 32 : 0), y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Invoice #${invoice.invoiceNumber}`, MARGIN, y + 11);
  y += 18;

  autoTable(doc, {
    ...tableBase,
    startY: y,
    body: [
      [`From: ${settings.name}`, `Bill To: ${customer.name}`],
      [`Paid: ${formatCurrency(amountPaid)}`, `Date: ${formatDate(invoice.issueDate)}`],
    ],
    bodyStyles: { fillColor: FILL_LIGHT, minCellHeight: 10 },
  });

  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;

  const itemRows = lineItemRows(invoice);
  autoTable(doc, {
    ...tableBase,
    startY: y,
    head: [["Description", "Qty", "Amount"]],
    body: itemRows.map((row) => [row[0], row[1], row[3]]),
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: { minCellHeight: LINE_ROW_HEIGHT },
    rowPageBreak: "avoid",
  });

  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;

  const rows: string[][] = [
    ["Subtotal", formatCurrency(totals.subtotal)],
    ...(totals.discount > 0
      ? [["Discount", `-${formatCurrency(totals.discount)}`]]
      : []),
    [`Tax (${invoice.taxRate}%)`, formatCurrency(totals.tax)],
    ["Total paid", formatCurrency(totals.total)],
  ];

  autoTable(doc, {
    ...tableBase,
    startY: y,
    margin: { left: MARGIN + CONTENT_WIDTH - 76, right: MARGIN },
    tableWidth: 76,
    body: rows,
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: "right", cellWidth: 36, fontStyle: "bold" },
    },
    bodyStyles: { fillColor: FILL_LIGHT },
  });

  if (payments.length > 0) {
    y =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
    autoTable(doc, {
      ...tableBase,
      startY: y,
      head: [["Date", "Amount", "Note"]],
      body: payments.map((p) => [
        formatDate(p.date),
        formatCurrency(p.amount),
        p.note?.trim() || "—",
      ]),
      headStyles: { fillColor: FILL_LIGHT, fontStyle: "bold" },
    });
  }

  return doc;
}

export function downloadReceiptPDF(
  invoice: Invoice,
  customer: Customer,
  settings: CompanySettings
): "downloaded" | "opened" {
  const doc = generateReceiptPDF(invoice, customer, settings);
  const blob = doc.output("blob");
  return downloadBlob(blob, `receipt-${invoice.invoiceNumber}.pdf`);
}
