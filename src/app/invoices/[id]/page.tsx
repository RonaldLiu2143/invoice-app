"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Mail,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceForm } from "@/components/InvoiceForm";
import { LoadingState } from "@/components/EmptyState";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  lineItemTotal,
} from "@/lib/calculations";
import { downloadInvoicePDF } from "@/lib/pdf";
import { getMailtoLink, shareInvoice } from "@/lib/share";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    data,
    isLoaded,
    getInvoice,
    getCustomer,
    getEffectiveStatus,
    updateInvoice,
    deleteInvoice,
  } = useInvoice();
  const [editing, setEditing] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  if (!isLoaded) return <LoadingState />;

  const invoice = getInvoice(id);
  if (!invoice) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Invoice not found</h1>
        <Link href="/invoices" className="mt-4 inline-block text-blue-700">
          Back to invoices
        </Link>
      </div>
    );
  }

  const customer = getCustomer(invoice.customerId);
  const effectiveStatus = getEffectiveStatus(invoice);
  const totals = calculateTotals(invoice.lineItems, invoice.taxRate);

  const handleStatusChange = (status: "paid" | "unpaid" | "overdue") => {
    updateInvoice(invoice.id, { status });
  };

  const handleDelete = () => {
    if (confirm("Delete this invoice permanently?")) {
      deleteInvoice(invoice.id);
      router.push("/invoices");
    }
  };

  const handleDownloadPDF = () => {
    if (!customer) return;
    downloadInvoicePDF(invoice, customer, data.settings);
  };

  const handleEmail = () => {
    if (!customer) return;
    window.location.href = getMailtoLink(invoice, customer, data.settings);
  };

  const handleShare = async () => {
    if (!customer) return;
    const ok = await shareInvoice(invoice, customer, data.settings);
    setShareMsg(ok ? "Copied to clipboard!" : "Could not share.");
    setTimeout(() => setShareMsg(""), 3000);
  };

  if (editing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Invoice #{invoice.invoiceNumber}
          </h1>
        </div>
        <InvoiceForm invoice={invoice} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <StatusBadge status={effectiveStatus} />
          </div>
          <p className="mt-1 text-slate-500">
            Issued {formatDate(invoice.issueDate)} · Due{" "}
            {formatDate(invoice.dueDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="secondary" onClick={handleEmail}>
            <Mail className="h-4 w-4" />
            Email
          </Button>
          <Button variant="secondary" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {shareMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {shareMsg}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(["paid", "unpaid", "overdue"] as const).map((s) => (
          <Button
            key={s}
            variant={invoice.status === s ? "primary" : "secondary"}
            className="capitalize"
            onClick={() => handleStatusChange(s)}
          >
            Mark {s}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            From
          </h2>
          <p className="font-semibold text-slate-900">{data.settings.name}</p>
          {data.settings.email && (
            <p className="text-sm text-slate-600">{data.settings.email}</p>
          )}
          {data.settings.phone && (
            <p className="text-sm text-slate-600">{data.settings.phone}</p>
          )}
          {data.settings.address && (
            <p className="text-sm text-slate-600">{data.settings.address}</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Bill To
          </h2>
          {customer ? (
            <>
              <p className="font-semibold text-slate-900">{customer.name}</p>
              {customer.email && (
                <p className="text-sm text-slate-600">{customer.email}</p>
              )}
              {customer.phone && (
                <p className="text-sm text-slate-600">{customer.phone}</p>
              )}
              {customer.address && (
                <p className="text-sm text-slate-600">{customer.address}</p>
              )}
            </>
          ) : (
            <p className="text-slate-500">Customer not found</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium text-right">Qty</th>
              <th className="px-6 py-3 font-medium text-right">Unit Price</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-6 py-4 text-slate-900">{item.description}</td>
                <td className="px-6 py-4 text-right text-slate-600">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-right text-slate-600">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {formatCurrency(lineItemTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-200 p-6">
          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {invoice.notes && (
        <Card className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Notes</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
