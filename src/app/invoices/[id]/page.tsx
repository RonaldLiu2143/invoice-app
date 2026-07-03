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
  formatDate,
} from "@/lib/calculations";
import { downloadInvoicePDF } from "@/lib/pdf";
import { getMailtoLink, shareInvoice } from "@/lib/share";
import { resolveTemplateId, INVOICE_TEMPLATES } from "@/lib/templates";
import { InvoicePreview } from "@/components/invoice-templates";
import { PaymentPanel } from "@/components/PaymentPanel";
import { Select } from "@/components/FormFields";
import type { InvoiceTemplateId } from "@/lib/types";

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
    addPayment,
    removePayment,
    payInvoiceInFull,
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
    if (status === "paid") {
      payInvoiceInFull(invoice.id);
      return;
    }
    if (status === "unpaid") {
      updateInvoice(invoice.id, { payments: [], status: "unpaid" });
      return;
    }
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

  const activeTemplateId = resolveTemplateId(invoice, data.settings);

  const handleTemplateChange = (templateId: InvoiceTemplateId) => {
    updateInvoice(invoice.id, { templateId });
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
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

      <div className="mb-6 flex flex-wrap gap-2">
        {(["paid", "unpaid", "overdue"] as const).map((s) => (
          <Button
            key={s}
            variant={effectiveStatus === s ? "primary" : "secondary"}
            className="capitalize"
            onClick={() => handleStatusChange(s)}
          >
            Mark {s}
          </Button>
        ))}
      </div>

      <PaymentPanel
        invoice={invoice}
        onAddPayment={(amount, date, note) =>
          addPayment(invoice.id, amount, date, note)
        }
        onRemovePayment={(paymentId) =>
          removePayment(invoice.id, paymentId)
        }
        onPayInFull={() => payInvoiceInFull(invoice.id)}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Select
          label="Invoice template"
          value={activeTemplateId}
          onChange={(e) =>
            handleTemplateChange(e.target.value as InvoiceTemplateId)
          }
          className="w-full sm:max-w-xs"
        >
          {INVOICE_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      {customer ? (
        <InvoicePreview
          templateId={activeTemplateId}
          invoice={invoice}
          customer={customer}
          settings={data.settings}
          status={effectiveStatus}
          totals={totals}
        />
      ) : (
        <Card className="p-8 text-center text-slate-500">Customer not found</Card>
      )}
    </div>
  );
}
