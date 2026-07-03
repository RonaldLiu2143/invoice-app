import type { AppData } from "./types";

const STORAGE_KEY = "invoice-app-data";

export const defaultAppData: AppData = {
  customers: [],
  products: [],
  invoices: [],
  settings: {
    name: "My Business",
    email: "billing@mybusiness.com",
    phone: "",
    address: "",
    taxRate: 8.5,
    templateId: "classic",
  },
  nextInvoiceNumber: 1001,
};

export function loadAppData(): AppData {
  if (typeof window === "undefined") return defaultAppData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppData;
    const parsed = JSON.parse(raw);
    return {
      ...defaultAppData,
      ...parsed,
      settings: { ...defaultAppData.settings, ...parsed.settings },
    };
  } catch {
    return defaultAppData;
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
