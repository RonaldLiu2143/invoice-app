import type { Customer, Invoice, Product } from "./types";
import { formatCurrency } from "./calculations";

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function matchesFields(
  query: string,
  fields: (string | number | undefined | null)[]
): boolean {
  if (!query.trim()) return true;

  const q = normalizeSearchText(query);
  const qPhone = normalizePhone(query);

  return fields.some((field) => {
    if (field === undefined || field === null || field === "") return false;
    const text = normalizeSearchText(String(field));
    if (text.includes(q)) return true;
    if (qPhone.length >= 3) {
      const fieldPhone = normalizePhone(text);
      if (fieldPhone.includes(qPhone)) return true;
    }
    return false;
  });
}

export function matchesCustomer(customer: Customer, query: string): boolean {
  return matchesFields(query, [
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
  ]);
}

export function matchesProduct(product: Product, query: string): boolean {
  return matchesFields(query, [
    product.name,
    product.description,
    product.price,
    formatCurrency(product.price),
  ]);
}

export function matchesInvoice(
  invoice: Invoice,
  customer: Customer | undefined,
  query: string
): boolean {
  const lineText = invoice.lineItems.map((item) => item.description).join(" ");
  return matchesFields(query, [
    invoice.invoiceNumber,
    invoice.notes,
    customer?.name,
    customer?.email,
    customer?.phone,
    customer?.address,
    lineText,
  ]);
}
