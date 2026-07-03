import type { Invoice, InvoiceTemplateId, CompanySettings } from "./types";

export interface TemplateTheme {
  primary: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  headerFill?: [number, number, number];
}

export interface InvoiceTemplateMeta {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  theme: TemplateTheme;
}

export const INVOICE_TEMPLATES: InvoiceTemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Professional blue header, clean tables",
    theme: {
      primary: [30, 58, 138],
      accent: [30, 58, 138],
      text: [30, 41, 59],
      muted: [100, 116, 139],
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Soft gradients and rounded accents",
    theme: {
      primary: [79, 70, 229],
      accent: [129, 140, 248],
      text: [30, 41, 59],
      muted: [100, 116, 139],
      headerFill: [238, 242, 255],
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Dark header band with high contrast",
    theme: {
      primary: [15, 23, 42],
      accent: [59, 130, 246],
      text: [30, 41, 59],
      muted: [100, 116, 139],
      headerFill: [15, 23, 42],
    },
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Warm tones with refined borders",
    theme: {
      primary: [120, 53, 15],
      accent: [180, 83, 9],
      text: [41, 37, 36],
      muted: [120, 113, 108],
      headerFill: [255, 251, 235],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Black and white, typography-focused",
    theme: {
      primary: [23, 23, 23],
      accent: [64, 64, 64],
      text: [23, 23, 23],
      muted: [115, 115, 115],
    },
  },
];

export function getTemplateMeta(id: InvoiceTemplateId): InvoiceTemplateMeta {
  return INVOICE_TEMPLATES.find((t) => t.id === id) ?? INVOICE_TEMPLATES[0];
}

export function resolveTemplateId(
  invoice: Invoice,
  settings: CompanySettings
): InvoiceTemplateId {
  return invoice.templateId ?? settings.templateId ?? "classic";
}
