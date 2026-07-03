import { describe, expect, it } from "vitest";
import type { Invoice } from "./types";
import {
  calculateTotals,
  getAmountPaid,
  getBalanceDue,
  resolveInvoiceStatus,
  getAgingBuckets,
  lineItemTotal,
} from "./calculations";

const baseInvoice: Invoice = {
  id: "inv-1",
  invoiceNumber: "1001",
  documentType: "invoice",
  customerId: "cust-1",
  lineItems: [
    { id: "li-1", description: "Consulting", quantity: 2, unitPrice: 100 },
  ],
  taxRate: 10,
  status: "unpaid",
  issueDate: "2026-06-01",
  dueDate: "2026-12-31",
  notes: "",
  payments: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("calculations", () => {
  it("calculates flat-price line items", () => {
    expect(
      lineItemTotal({
        id: "li-2",
        description: "Install",
        quantity: 1,
        unitPrice: 450,
        priceMode: "flat",
      })
    ).toBe(450);
  });

  it("calculates totals with tax", () => {
    expect(calculateTotals(baseInvoice.lineItems, 10)).toEqual({
      subtotal: 200,
      discount: 0,
      tax: 20,
      total: 220,
    });
  });

  it("applies percent discount before tax", () => {
    expect(
      calculateTotals(baseInvoice.lineItems, 10, { type: "percent", value: 10 })
    ).toEqual({
      subtotal: 200,
      discount: 20,
      tax: 18,
      total: 198,
    });
  });

  it("migrates legacy paid through payment records in getAmountPaid", () => {
    const legacyPaid: Invoice = {
      ...baseInvoice,
      status: "paid",
      payments: [{ id: "p1", amount: 220, date: "2026-06-02", note: "", createdAt: "" }],
    };
    expect(getAmountPaid(legacyPaid)).toBe(220);
    expect(getBalanceDue(legacyPaid)).toBe(0);
    expect(resolveInvoiceStatus(legacyPaid)).toBe("paid");
  });

  it("returns partial when partially paid and not overdue", () => {
    const partial: Invoice = {
      ...baseInvoice,
      dueDate: "2099-01-01",
      payments: [{ id: "p1", amount: 100, date: "2026-06-02", note: "", createdAt: "" }],
    };
    expect(resolveInvoiceStatus(partial)).toBe("partial");
    expect(getBalanceDue(partial)).toBe(120);
  });

  it("returns overdue when past due with balance even if partially paid", () => {
    const overduePartial: Invoice = {
      ...baseInvoice,
      dueDate: "2020-01-01",
      payments: [{ id: "p1", amount: 50, date: "2026-06-02", note: "", createdAt: "" }],
    };
    expect(resolveInvoiceStatus(overduePartial)).toBe("overdue");
  });

  it("respects manual overdue flag when no payments", () => {
    const manualOverdue: Invoice = {
      ...baseInvoice,
      status: "overdue",
      dueDate: "2099-01-01",
    };
    expect(resolveInvoiceStatus(manualOverdue)).toBe("overdue");
  });

  it("buckets aging by days past due", () => {
    const buckets = getAgingBuckets([
      { ...baseInvoice, id: "a", dueDate: "2099-01-01" },
      { ...baseInvoice, id: "b", dueDate: "2020-01-01" },
      { ...baseInvoice, id: "c", documentType: "quote", dueDate: "2020-01-01" },
    ]);
    expect(buckets.current).toBe(220);
    expect(buckets.days60plus).toBe(220);
  });
});
