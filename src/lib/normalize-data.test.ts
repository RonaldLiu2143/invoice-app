import { describe, expect, it } from "vitest";
import { defaultAppData } from "./storage";
import { normalizeAppData } from "./normalize-data";

describe("normalizeAppData", () => {
  it("migrates legacy paid invoices to payment records", () => {
    const result = normalizeAppData(
      {
        invoices: [
          {
            id: "inv-1",
            invoiceNumber: "1001",
            customerId: "cust-1",
            lineItems: [
              { id: "li-1", description: "Work", quantity: 1, unitPrice: 100 },
            ],
            taxRate: 0,
            status: "paid",
            issueDate: "2026-01-01",
            dueDate: "2026-02-01",
            notes: "",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
      },
      defaultAppData
    );

    expect(result.invoices[0].payments).toHaveLength(1);
    expect(result.invoices[0].payments[0].amount).toBe(100);
    expect(result.invoices[0].payments[0].note).toContain("legacy");
  });

  it("drops invalid payments and unknown template ids", () => {
    const result = normalizeAppData(
      {
        settings: { templateId: "not-real" },
        invoices: [
          {
            id: "inv-2",
            invoiceNumber: "1002",
            customerId: "cust-1",
            lineItems: [],
            taxRate: 0,
            status: "unpaid",
            issueDate: "2026-01-01",
            dueDate: "2026-02-01",
            notes: "",
            payments: [{ amount: -5 }],
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
      defaultAppData
    );

    expect(result.settings.templateId).toBe("classic");
    expect(result.invoices[0].payments).toHaveLength(0);
  });
});
