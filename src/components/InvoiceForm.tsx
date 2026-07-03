"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useInvoice, createEmptyLineItem } from "@/context/InvoiceContext";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/FormFields";
import { CustomerNameField } from "@/components/CustomerNameField";
import { JobPhotosPanel } from "@/components/JobPhotosPanel";
import {
  ProductDescriptionField,
  lineItemInputClass,
} from "@/components/ProductDescriptionField";
import {
  calculateTotals,
  documentLabel,
  dueDateFromIssue,
  formatCurrency,
  getAmountPaid,
  lineItemTotal,
  PAYMENT_TOLERANCE,
  todayISO,
} from "@/lib/calculations";
import type {
  DiscountType,
  DocumentType,
  Invoice,
  InvoiceLineItem,
  InvoiceTemplateId,
  JobPhoto,
  LineItemPriceMode,
  Product,
} from "@/lib/types";
import { INVOICE_TEMPLATES } from "@/lib/templates";

export function InvoiceForm({
  invoice,
  documentType = "invoice",
  onSaved,
}: {
  invoice?: Invoice;
  documentType?: DocumentType;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { data, addInvoice, updateInvoice, addCustomer } = useInvoice();
  const activeType = invoice?.documentType ?? documentType;
  const isQuote = activeType === "quote";
  const typeLabel = documentLabel({ documentType: activeType } as Invoice);

  const initialCustomer = useMemo(
    () => data.customers.find((customer) => customer.id === invoice?.customerId),
    [data.customers, invoice?.customerId]
  );

  const [customerId, setCustomerId] = useState(invoice?.customerId ?? "");
  const [customerName, setCustomerName] = useState(initialCustomer?.name ?? "");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems ?? [createEmptyLineItem()]
  );
  const [taxRate, setTaxRate] = useState(
    invoice?.taxRate ?? data.settings.taxRate
  );
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ?? todayISO()
  );
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ?? dueDateFromIssue(todayISO())
  );
  const [jobReference, setJobReference] = useState(invoice?.jobReference ?? "");
  const [notes, setNotes] = useState(
    invoice?.notes ?? data.settings.defaultNotes ?? ""
  );
  const [terms, setTerms] = useState(
    invoice?.terms ?? data.settings.defaultTerms ?? ""
  );
  const [discountMode, setDiscountMode] = useState<"none" | DiscountType>(
    invoice?.discountType && invoice.discountValue
      ? invoice.discountType
      : "none"
  );
  const [discountValue, setDiscountValue] = useState(
    invoice?.discountValue ?? 0
  );
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>(
    invoice?.templateId ?? data.settings.templateId ?? "classic"
  );
  const [jobPhotos, setJobPhotos] = useState<JobPhoto[]>(
    invoice?.jobPhotos ?? []
  );

  const discount =
    discountMode === "none" || discountValue <= 0
      ? undefined
      : { type: discountMode, value: discountValue };

  const totals = calculateTotals(lineItems, taxRate, discount);

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

  const addProductAsNewLine = (productId: string) => {
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
        serialNumber: product.serialNumber,
        priceMode: "unit",
      },
    ]);
  };

  const applyProductToLine = (itemId: string, product: Product) => {
    updateLineItem(itemId, {
      productId: product.id,
      description: product.name,
      unitPrice: product.price,
      serialNumber: product.serialNumber,
      priceMode: "unit",
      quantity: lineItems.find((item) => item.id === itemId)?.quantity || 1,
    });
  };

  const setLinePriceMode = (itemId: string, priceMode: LineItemPriceMode) => {
    if (priceMode === "flat") {
      updateLineItem(itemId, { priceMode, quantity: 1 });
      return;
    }
    updateLineItem(itemId, { priceMode });
  };

  const resolveCustomerId = (): string => {
    if (customerId) return customerId;
    const name = customerName.trim();
    if (!name) return "";

    const existing = data.customers.find(
      (customer) => customer.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing.id;

    const created = addCustomer({
      name,
      email: "",
      phone: "",
      address: "",
    });
    setCustomerId(created.id);
    return created.id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter a customer name.");
      return;
    }

    const resolvedCustomerId = resolveCustomerId();
    if (!resolvedCustomerId) {
      alert("Please enter a customer name.");
      return;
    }

    const validItems = lineItems.filter(
      (item) =>
        item.description.trim() &&
        item.unitPrice > 0 &&
        (item.priceMode === "flat" || item.quantity > 0)
    );
    if (validItems.length === 0) {
      alert("Add at least one line item.");
      return;
    }

    const newTotal = calculateTotals(validItems, taxRate, discount).total;
    if (invoice && !isQuote) {
      const amountPaid = getAmountPaid(invoice);
      if (amountPaid > newTotal + PAYMENT_TOLERANCE) {
        alert(
          `Invoice total cannot be less than amount already paid (${formatCurrency(amountPaid)}).`
        );
        return;
      }
    }

    const payload = {
      documentType: activeType,
      customerId: resolvedCustomerId,
      lineItems: validItems,
      taxRate,
      discountType: discount?.type,
      discountValue: discount?.value,
      status: invoice?.status ?? "unpaid",
      issueDate,
      dueDate,
      jobReference: jobReference.trim() || undefined,
      notes,
      terms: terms.trim() || undefined,
      templateId,
      payments: invoice?.payments ?? [],
      jobPhotos,
    };

    if (invoice) {
      updateInvoice(invoice.id, payload);
      if (onSaved) {
        onSaved();
      } else {
        router.push(`/invoices/${invoice.id}`);
      }
    } else {
      const created = addInvoice(payload);
      router.push(`/invoices/${created.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader title={`${typeLabel} Details`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomerNameField
            customers={data.customers}
            customerId={customerId}
            customerName={customerName}
            onCustomerIdChange={setCustomerId}
            onCustomerNameChange={setCustomerName}
            onAddCustomer={(name) =>
              addCustomer({ name, email: "", phone: "", address: "" })
            }
          />
          <Input
            label="Job / PO Reference"
            value={jobReference}
            onChange={(e) => setJobReference(e.target.value)}
            placeholder="e.g. Kitchen remodel, PO-4421"
          />
          <Input
            label="Issue Date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
          <Input
            label={isQuote ? "Valid Until" : "Due Date"}
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
                  if (e.target.value) addProductAsNewLine(e.target.value);
                }}
                className="!w-full sm:!w-52"
              >
                <option value="">+ Add from catalog</option>
                {data.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatCurrency(product.price)}
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        />

        <div className="space-y-3">
          <div className="hidden items-center gap-3 border-b border-slate-200 pb-2 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_72px_72px_56px_88px_72px_40px]">
            <span>Description</span>
            <span>S/N</span>
            <span>Pricing</span>
            <span>Qty</span>
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {lineItems.map((item) => {
            const flat = item.priceMode === "flat";
            return (
            <div
              key={item.id}
              className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_72px_72px_56px_88px_72px_40px] sm:items-center sm:border-0 sm:p-0 sm:pb-1"
            >
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                  Description
                </span>
                <ProductDescriptionField
                  products={data.products}
                  value={item.description}
                  productId={item.productId}
                  onValueChange={(description, linkedProductId) =>
                    updateLineItem(item.id, {
                      description,
                      productId: linkedProductId,
                    })
                  }
                  onProductSelect={(product) =>
                    applyProductToLine(item.id, product)
                  }
                />
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                  S/N
                </span>
                <input
                  type="text"
                  placeholder="Serial #"
                  value={item.serialNumber ?? ""}
                  onChange={(e) =>
                    updateLineItem(item.id, { serialNumber: e.target.value })
                  }
                  className={lineItemInputClass}
                />
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                  Pricing
                </span>
                <select
                  value={item.priceMode ?? "unit"}
                  onChange={(e) =>
                    setLinePriceMode(
                      item.id,
                      e.target.value as LineItemPriceMode
                    )
                  }
                  className={lineItemInputClass}
                >
                  <option value="unit">Unit × Qty</option>
                  <option value="flat">Flat price</option>
                </select>
              </div>

              <div className={flat ? "opacity-40" : ""}>
                <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                  Qty
                </span>
                <input
                  type="number"
                  min="1"
                  value={flat ? 1 : item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={flat}
                  className={lineItemInputClass}
                />
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                  {flat ? "Price" : "Unit Price"}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={lineItemInputClass}
                />
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="text-xs font-medium text-slate-500 sm:hidden">
                  Amount
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {formatCurrency(lineItemTotal(item))}
                </span>
              </div>

              <div className="flex justify-end sm:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="!h-[38px] !p-2 text-red-600"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length <= 1}
                  aria-label="Remove line item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
          })}

          <Button type="button" variant="secondary" onClick={addLineItem}>
            <Plus className="h-4 w-4" />
            Add Line Item
          </Button>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Discount"
              value={discountMode}
              onChange={(e) =>
                setDiscountMode(e.target.value as "none" | DiscountType)
              }
            >
              <option value="none">None</option>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed amount ($)</option>
            </Select>
            {discountMode !== "none" && (
              <Input
                label={discountMode === "percent" ? "Discount %" : "Discount $"}
                type="number"
                min="0"
                step={discountMode === "percent" ? "0.1" : "0.01"}
                value={discountValue || ""}
                onChange={(e) =>
                  setDiscountValue(parseFloat(e.target.value) || 0)
                }
              />
            )}
          </div>

          <div className="w-full space-y-2 text-sm sm:ml-auto sm:w-64">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
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

      <JobPhotosPanel photos={jobPhotos} onChange={setJobPhotos} />

      <Card>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Thank you message, job details, etc."
        />
      </Card>

      <Card>
        <Textarea
          label="Terms & Conditions"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={3}
          placeholder="Payment terms, warranty, cancellation policy, etc."
        />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit">
          {invoice ? "Save Changes" : `Create ${typeLabel}`}
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
