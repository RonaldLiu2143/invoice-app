"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer, Invoice, CompanySettings, InvoiceStatus, InvoiceTemplateId } from "@/lib/types";
import { generateInvoicePDF } from "@/lib/pdf";
import { calculateInvoiceTotals } from "@/lib/calculations";
import { InvoiceDocumentLayout } from "@/components/invoice-templates/InvoiceDocumentLayout";

function prefersHtmlPreview(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
}

export function InvoicePdfPreview({
  invoice,
  customer,
  settings,
  templateId,
  status,
  className = "",
}: {
  invoice: Invoice;
  customer: Customer;
  settings: CompanySettings;
  templateId: InvoiceTemplateId;
  status: InvoiceStatus;
  className?: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [useHtmlPreview, setUseHtmlPreview] = useState(false);
  const totals = useMemo(() => calculateInvoiceTotals(invoice), [invoice]);

  useEffect(() => {
    setUseHtmlPreview(prefersHtmlPreview());
    const doc = generateInvoicePDF(invoice, customer, settings);
    const url = URL.createObjectURL(doc.output("blob"));
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [invoice, customer, settings]);

  if (useHtmlPreview) {
    return (
      <div className={`min-h-[480px] ${className}`}>
        <InvoiceDocumentLayout
          templateId={templateId}
          invoice={invoice}
          customer={customer}
          settings={settings}
          status={status}
          totals={totals}
        />
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div
        className={`flex min-h-[480px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`}
      >
        Generating PDF preview…
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-300 bg-slate-100 shadow-sm ${className}`}
    >
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0`}
        title={`Invoice ${invoice.invoiceNumber} PDF preview`}
        className="h-[min(85vh,1050px)] w-full bg-white"
      />
    </div>
  );
}
