import { v4 as uuidv4 } from "uuid";
import type {
  AppData,
  CompanySettings,
  Customer,
  DiscountType,
  DocumentType,
  Invoice,
  InvoiceTemplateId,
  JobPhoto,
  LineItemPriceMode,
  Payment,
  Product,
} from "./types";
import { calculateTotals } from "./calculations";
import { INVOICE_TEMPLATES } from "./templates";

const VALID_TEMPLATE_IDS = new Set(
  INVOICE_TEMPLATES.map((template) => template.id)
);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeJobPhoto(raw: unknown): JobPhoto | null {
  if (!raw || typeof raw !== "object") return null;
  const photo = raw as Record<string, unknown>;
  const dataUrl = asString(photo.dataUrl);
  if (!dataUrl.startsWith("data:image/")) return null;

  return {
    id: asString(photo.id, uuidv4()),
    dataUrl,
    caption: asString(photo.caption),
    serialNumber: asString(photo.serialNumber),
    showSerialNumber: photo.showSerialNumber !== false,
    createdAt: asString(photo.createdAt, new Date().toISOString()),
  };
}

function normalizePayment(raw: unknown): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const payment = raw as Record<string, unknown>;
  const amount = asNumber(payment.amount);
  if (amount <= 0) return null;

  return {
    id: asString(payment.id, uuidv4()),
    amount,
    date: asString(payment.date, new Date().toISOString().split("T")[0]),
    note: asString(payment.note),
    createdAt: asString(payment.createdAt, new Date().toISOString()),
  };
}

function migrateLegacyPaid(invoice: Invoice): Invoice {
  if (invoice.payments.length > 0) return invoice;
  if (invoice.status !== "paid") return invoice;

  const total = calculateTotals(
    invoice.lineItems,
    invoice.taxRate,
    { type: invoice.discountType, value: invoice.discountValue }
  ).total;
  return {
    ...invoice,
    payments: [
      {
        id: `legacy-${invoice.id}`,
        amount: total,
        date: invoice.issueDate,
        note: "Migrated from legacy paid status",
        createdAt: invoice.updatedAt || invoice.createdAt,
      },
    ],
  };
}

export function normalizeInvoice(raw: unknown): Invoice | null {
  if (!raw || typeof raw !== "object") return null;
  const inv = raw as Record<string, unknown>;

  const lineItems = Array.isArray(inv.lineItems)
    ? inv.lineItems
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const line = item as Record<string, unknown>;
          const priceModeRaw = line.priceMode;
          const priceMode: LineItemPriceMode | undefined =
            priceModeRaw === "flat" || priceModeRaw === "unit"
              ? priceModeRaw
              : undefined;
          return {
            id: asString(line.id, uuidv4()),
            productId:
              typeof line.productId === "string" ? line.productId : undefined,
            description: asString(line.description),
            quantity: Math.max(0, asNumber(line.quantity, 1)),
            unitPrice: Math.max(0, asNumber(line.unitPrice)),
            priceMode,
            serialNumber: asString(line.serialNumber) || undefined,
          };
        })
    : [];

  const payments = Array.isArray(inv.payments)
    ? inv.payments
        .map(normalizePayment)
        .filter((payment): payment is Payment => payment !== null)
    : [];

  const templateId = asString(inv.templateId, "classic") as InvoiceTemplateId;

  const documentType: DocumentType =
    inv.documentType === "quote" ? "quote" : "invoice";

  const discountType =
    inv.discountType === "percent" || inv.discountType === "fixed"
      ? (inv.discountType as DiscountType)
      : undefined;
  const discountValue = asNumber(inv.discountValue);
  const normalizedDiscountValue =
    discountType && discountValue > 0 ? discountValue : undefined;

  const jobPhotos = Array.isArray(inv.jobPhotos)
    ? inv.jobPhotos
        .map(normalizeJobPhoto)
        .filter((photo): photo is JobPhoto => photo !== null)
        .slice(0, 8)
    : [];

  const invoice: Invoice = {
    id: asString(inv.id, uuidv4()),
    invoiceNumber: asString(inv.invoiceNumber, "0"),
    documentType,
    customerId: asString(inv.customerId),
    lineItems,
    taxRate: Math.max(0, asNumber(inv.taxRate)),
    discountType: normalizedDiscountValue ? discountType : undefined,
    discountValue: normalizedDiscountValue,
    status:
      inv.status === "paid" ||
      inv.status === "unpaid" ||
      inv.status === "overdue" ||
      inv.status === "partial"
        ? inv.status
        : "unpaid",
    issueDate: asString(inv.issueDate, new Date().toISOString().split("T")[0]),
    dueDate: asString(inv.dueDate, new Date().toISOString().split("T")[0]),
    jobReference: asString(inv.jobReference) || undefined,
    notes: asString(inv.notes),
    terms: asString(inv.terms) || undefined,
    templateId: VALID_TEMPLATE_IDS.has(templateId) ? templateId : "classic",
    payments,
    jobPhotos,
    createdAt: asString(inv.createdAt, new Date().toISOString()),
    updatedAt: asString(inv.updatedAt, new Date().toISOString()),
  };

  if (!invoice.customerId) return null;
  return migrateLegacyPaid(invoice);
}

function normalizeCustomer(raw: unknown): Customer | null {
  if (!raw || typeof raw !== "object") return null;
  const customer = raw as Record<string, unknown>;
  const name = asString(customer.name).trim();
  if (!name) return null;

  return {
    id: asString(customer.id, uuidv4()),
    name,
    email: asString(customer.email),
    phone: asString(customer.phone),
    address: asString(customer.address),
    createdAt: asString(customer.createdAt, new Date().toISOString()),
  };
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const product = raw as Record<string, unknown>;
  const name = asString(product.name).trim();
  if (!name) return null;

  return {
    id: asString(product.id, uuidv4()),
    name,
    description: asString(product.description),
    price: Math.max(0, asNumber(product.price)),
    serialNumber: asString(product.serialNumber) || undefined,
    createdAt: asString(product.createdAt, new Date().toISOString()),
  };
}

function normalizeSettings(
  raw: unknown,
  fallback: CompanySettings
): CompanySettings {
  if (!raw || typeof raw !== "object") return fallback;
  const settings = raw as Record<string, unknown>;
  const templateId = asString(settings.templateId, fallback.templateId) as InvoiceTemplateId;
  const logoDataUrl = asString(settings.logoDataUrl);
  const defaultTerms = asString(settings.defaultTerms);
  const defaultNotes = asString(settings.defaultNotes);

  return {
    name: asString(settings.name, fallback.name) || fallback.name,
    email: asString(settings.email, fallback.email),
    phone: asString(settings.phone, fallback.phone),
    address: asString(settings.address, fallback.address),
    taxRate: Math.max(0, asNumber(settings.taxRate, fallback.taxRate)),
    templateId: VALID_TEMPLATE_IDS.has(templateId) ? templateId : fallback.templateId,
    logoDataUrl: logoDataUrl.startsWith("data:image/") ? logoDataUrl : undefined,
    defaultTerms: defaultTerms || undefined,
    defaultNotes: defaultNotes || undefined,
  };
}

export function normalizeAppData(
  parsed: unknown,
  defaults: AppData
): AppData {
  if (!parsed || typeof parsed !== "object") return defaults;
  const raw = parsed as Record<string, unknown>;

  const customers = Array.isArray(raw.customers)
    ? raw.customers
        .map(normalizeCustomer)
        .filter((customer): customer is Customer => customer !== null)
    : defaults.customers;

  const products = Array.isArray(raw.products)
    ? raw.products
        .map(normalizeProduct)
        .filter((product): product is Product => product !== null)
    : defaults.products;

  const invoices = Array.isArray(raw.invoices)
    ? raw.invoices
        .map(normalizeInvoice)
        .filter((invoice): invoice is Invoice => invoice !== null)
    : defaults.invoices;

  const maxInvoiceNumber = invoices.reduce((max, invoice) => {
    const parsed = parseInt(invoice.invoiceNumber, 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return {
    customers,
    products,
    invoices,
    settings: normalizeSettings(raw.settings, defaults.settings),
    nextInvoiceNumber: Math.max(
      defaults.nextInvoiceNumber,
      asNumber(raw.nextInvoiceNumber, defaults.nextInvoiceNumber),
      maxInvoiceNumber + 1
    ),
  };
}
