import type { Customer, Invoice, Product } from "./types";

function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function matchesTextFields(
  query: string,
  fields: (string | number | undefined | null)[]
): boolean {
  if (!query.trim()) return true;
  const q = normalizeSearchText(query);
  return fields.some((field) => {
    if (field === undefined || field === null || field === "") return false;
    return normalizeSearchText(String(field)).includes(q);
  });
}

function matchesPhoneField(query: string, phone: string | undefined | null): boolean {
  if (!query.trim() || !phone) return false;
  const qPhone = normalizePhone(query);
  if (qPhone.length < 3) return false;
  return normalizePhone(phone).includes(qPhone);
}

export function matchesCustomer(customer: Customer, query: string): boolean {
  if (!query.trim()) return true;
  return (
    matchesTextFields(query, [customer.name, customer.email, customer.address]) ||
    matchesPhoneField(query, customer.phone)
  );
}

export function matchesProduct(product: Product, query: string): boolean {
  if (!query.trim()) return true;
  return matchesTextFields(query, [
    product.name,
    product.description,
    product.serialNumber ?? "",
    product.price,
    String(product.price),
  ]);
}

export function matchesInvoice(
  invoice: Invoice,
  customer: Customer | undefined,
  query: string
): boolean {
  if (!query.trim()) return true;
  const lineText = invoice.lineItems.map((item) => item.description).join(" ");
  return (
    matchesTextFields(query, [
      invoice.invoiceNumber,
      invoice.notes,
      invoice.jobReference ?? "",
      invoice.terms ?? "",
      lineText,
    ]) ||
    (customer ? matchesCustomer(customer, query) : false)
  );
}
