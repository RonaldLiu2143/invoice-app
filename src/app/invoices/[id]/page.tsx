"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  FileCheck,
  Mail,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
import { InvoiceForm } from "@/components/InvoiceForm";
import { LoadingState } from "@/components/EmptyState";
import {
  documentLabel,
  formatDate,
  isQuote,
} from "@/lib/calculations";
import { downloadInvoicePDF, downloadReceiptPDF } from "@/lib/pdf";
import { getMailtoLink, shareInvoice } from "@/lib/share";
import { resolveTemplateId, INVOICE_TEMPLATES } from "@/lib/templates";
import { InvoicePdfPreview } from "@/components/InvoicePdfPreview";
import { PaymentPanel } from "@/components/PaymentPanel";
import { PaymentHistoryPanel } from "@/components/PaymentHistoryPanel";
import { JobPhotosPanel } from "@/components/JobPhotosPanel";
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
    duplicateInvoice,
    convertQuoteToInvoice,
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
  const quote = isQuote(invoice);
  const typeLabel = documentLabel(invoice);

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
    if (confirm(`Delete this ${typeLabel.toLowerCase()} permanently?`)) {
      deleteInvoice(invoice.id);
      router.push("/invoices");
    }
  };

  const handleDownloadPDF = () => {
    if (!customer) return;
    const outcome = downloadInvoicePDF(invoice, customer, data.settings);
    if (outcome === "opened") {
      setShareMsg("PDF opened — use your browser's Share menu to save it.");
      setTimeout(() => setShareMsg(""), 4000);
    }
  };

  const handleDownloadReceipt = () => {
    if (!customer) return;
    const outcome = downloadReceiptPDF(invoice, customer, data.settings);
    if (outcome === "opened") {
      setShareMsg("Receipt opened — use your browser's Share menu to save it.");
      setTimeout(() => setShareMsg(""), 4000);
    }
  };

  const handleDuplicate = () => {
    const copy = duplicateInvoice(invoice.id);
    if (copy) router.push(`/invoices/${copy.id}`);
  };

  const handleConvertQuote = () => {
    if (
      !confirm(
        "Convert this quote to an invoice? It will get a new invoice number and today's issue date."
      )
    ) {
      return;
    }
    const converted = convertQuoteToInvoice(invoice.id);
    if (converted) router.refresh();
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
    const result = await shareInvoice(invoice, customer, data.settings);
    const message =
      result === "shared"
        ? "Shared successfully!"
        : result === "copied"
          ? "Copied to clipboard!"
          : result === "failed"
            ? "Could not share. Try the PDF button instead."
            : "";
    if (message) {
      setShareMsg(message);
      setTimeout(() => setShareMsg(""), 3000);
    }
  };

  if (editing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Edit {typeLabel} #{invoice.invoiceNumber}
          </h1>
        </div>
        <InvoiceForm invoice={invoice} onSaved={() => setEditing(false)} />
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
              {typeLabel} #{invoice.invoiceNumber}
            </h1>
            <DocumentStatusBadge
              invoice={invoice}
              status={effectiveStatus}
              size="lg"
            />
          </div>
          <p className="mt-1 text-slate-500">
            Issued {formatDate(invoice.issueDate)}
            {quote
              ? ` · Valid until ${formatDate(invoice.dueDate)}`
              : ` · Due ${formatDate(invoice.dueDate)}`}
            {invoice.jobReference?.trim()
              ? ` · Job/PO: ${invoice.jobReference.trim()}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quote && (
            <Button onClick={handleConvertQuote}>
              <FileCheck className="h-4 w-4" />
              Convert to Invoice
            </Button>
          )}
          <Button variant="secondary" onClick={handleDuplicate}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          {!quote && effectiveStatus === "paid" && (
            <Button variant="secondary" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4" />
              Receipt
            </Button>
          )}
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

      {!quote && (
        <>
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
            onPayInFull={() => payInvoiceInFull(invoice.id)}
          />

          <PaymentHistoryPanel
            invoice={invoice}
            onRemovePayment={(paymentId) =>
              removePayment(invoice.id, paymentId)
            }
          />
        </>
      )}

      <JobPhotosPanel
        photos={invoice.jobPhotos ?? []}
        onChange={(jobPhotos) => updateInvoice(invoice.id, { jobPhotos })}
      />

      <Card className="mb-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">PDF Preview</h2>
            <p className="text-sm text-slate-500">
              Live preview of the PDF your customer will receive
            </p>
          </div>
          <Select
            label="Template"
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
          <InvoicePdfPreview
            invoice={invoice}
            customer={customer}
            settings={data.settings}
          />
        ) : (
          <p className="py-8 text-center text-slate-500">Customer not found</p>
        )}
      </Card>
    </div>
  );
}
