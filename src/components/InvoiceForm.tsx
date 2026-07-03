"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useInvoice, createEmptyLineItem } from "@/context/InvoiceContext";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/FormFields";
import {
  calculateTotals,
  formatCurrency,
  lineItemTotal,
} from "@/lib/calculations";
import type { Invoice, InvoiceLineItem, InvoiceTemplateId } from "@/lib/types";
import { INVOICE_TEMPLATES } from "@/lib/templates";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function dueDateISO(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function InvoiceForm({ invoice }: { invoice?: Invoice }) {
  const router = useRouter();
  const { data, addInvoice, updateInvoice } = useInvoice();

  const [customerId, setCustomerId] = useState(invoice?.customerId ?? "");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems ?? [createEmptyLineItem()]
  );
  const [taxRate, setTaxRate] = useState(
    invoice?.taxRate ?? data.settings.taxRate
  );
  const [status, setStatus] = useState<Invoice["status"]>(
    invoice?.status ?? "unpaid"
  );
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ?? todayISO()
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? dueDateISO());
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>(
    invoice?.templateId ?? data.settings.templateId ?? "classic"
  );

  const totals = calculateTotals(lineItems, taxRate);

  const updateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    setLineItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((items) => [...items, createEmptyLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((items) => items.filter((item) => item.id !== id));
  };

  const addProductToLine = (productId: string) => {
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;
    setLineItems((items) => [
      ...items,
      {
        id: uuidv4(),
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }
    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.quantity > 0
    );
    if (validItems.length === 0) {
      alert("Add at least one line item.");
      return;
    }

    const payload = {
      customerId,
      lineItems: validItems,
      taxRate,
      status,
      issueDate,
      dueDate,
      notes,
      templateId,
      payments: invoice?.payments ?? [],
    };

    if (invoice) {
      updateInvoice(invoice.id, payload);
      router.push(`/invoices/${invoice.id}`);
    } else {
      const created = addInvoice(payload);
      router.push(`/invoices/${created.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader title="Invoice Details" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Customer *"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select a customer</option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Invoice["status"])
            }
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
          <Input
            label="Issue Date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <Input
            label="Tax Rate (%)"
            type="number"
            min="0"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
          />
          <Select
            label="Template"
            value={templateId}
            onChange={(e) =>
              setTemplateId(e.target.value as InvoiceTemplateId)
            }
          >
            {INVOICE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Line Items"
          action={
            data.products.length > 0 ? (
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) addProductToLine(e.target.value);
                }}
                className="!w-48"
              >
                <option value="">+ Add from catalog</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)}
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        />
        <div className="space-y-3">
          <div className="hidden gap-3 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[1fr_80px_120px_100px_40px]">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span>Amount</span>
            <span />
          </div>
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_80px_120px_100px_40px] sm:border-0 sm:p-0"
            >
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  updateLineItem(item.id, { description: e.target.value })
                }
              />
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <div className="flex items-center text-sm font-medium text-slate-700">
                {formatCurrency(lineItemTotal(item))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="!p-2 text-red-600"
                onClick={() => removeLineItem(item.id)}
                disabled={lineItems.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addLineItem}>
            <Plus className="h-4 w-4" />
            Add Line Item
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Payment terms, thank you message, etc."
        />
      </Card>

      <div className="flex gap-3">
        <Button type="submit">
          {invoice ? "Save Changes" : "Create Invoice"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
