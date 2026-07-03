import { describe, expect, it } from "vitest";
import type { Customer, Invoice, Product } from "./types";
import { matchesCustomer, matchesInvoice, matchesProduct } from "./search";

const customer: Customer = {
  id: "c1",
  name: "Northwind Traders",
  email: "accounts@northwind.com",
  phone: "(555) 987-6543",
  address: "456 Commerce St, Seattle",
  createdAt: "",
};

const product: Product = {
  id: "p1",
  name: "Consulting",
  description: "Hourly consulting",
  price: 150,
  createdAt: "",
};

const invoice: Invoice = {
  id: "i1",
  invoiceNumber: "1001",
  customerId: "c1",
  lineItems: [{ id: "l1", description: "Logo Design", quantity: 1, unitPrice: 500 }],
  taxRate: 0,
  status: "unpaid",
  issueDate: "2026-01-01",
  dueDate: "2026-02-01",
  notes: "Rush project",
  payments: [],
  createdAt: "",
  updatedAt: "",
};

describe("search", () => {
  it("matches customer by name, email, address, and phone digits", () => {
    expect(matchesCustomer(customer, "northwind")).toBe(true);
    expect(matchesCustomer(customer, "accounts@")).toBe(true);
    expect(matchesCustomer(customer, "seattle")).toBe(true);
    expect(matchesCustomer(customer, "555987")).toBe(true);
  });

  it("does not match product price using phone digit heuristics only", () => {
    expect(matchesProduct(product, "234")).toBe(false);
    expect(matchesProduct(product, "consulting")).toBe(true);
    expect(matchesProduct(product, "150")).toBe(true);
  });

  it("matches invoice by number, notes, line items, and customer fields", () => {
    expect(matchesInvoice(invoice, customer, "1001")).toBe(true);
    expect(matchesInvoice(invoice, customer, "logo design")).toBe(true);
    expect(matchesInvoice(invoice, customer, "rush")).toBe(true);
    expect(matchesInvoice(invoice, customer, "555987")).toBe(true);
  });
});
