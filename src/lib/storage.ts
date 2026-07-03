import type { AppData } from "./types";
import { normalizeAppData } from "./normalize-data";

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
    return normalizeAppData(parsed, defaultAppData);
  } catch {
    return defaultAppData;
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save invoice data:", error);
  }
}
