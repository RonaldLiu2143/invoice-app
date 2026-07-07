"use client";

import { useEffect, useState } from "react";
import type { Customer, Invoice, CompanySettings } from "@/lib/types";
import { generateInvoicePDF } from "@/lib/pdf";
import { Button } from "@/components/Button";

function isMobilePdfPreview(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
}

export function InvoicePdfPreview({
  invoice,
  customer,
  settings,
  className = "",
}: {
  invoice: Invoice;
  customer: Customer;
  settings: CompanySettings;
  className?: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);

  useEffect(() => {
    setMobilePreview(isMobilePdfPreview());
    const doc = generateInvoicePDF(invoice, customer, settings);
    const url = URL.createObjectURL(doc.output("blob"));
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [invoice, customer, settings]);

  if (!pdfUrl) {
    return (
      <div
        className={`flex min-h-[480px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`}
      >
        Generating PDF preview…
      </div>
    );
  }

  if (mobilePreview) {
    return (
      <div
        className={`flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center ${className}`}
      >
        <p className="text-sm text-slate-600">
          Inline PDF preview isn&apos;t supported on this device. Open the PDF to
          view or share it.
        </p>
        <Button href={pdfUrl} variant="secondary" target="_blank">
          Open PDF
        </Button>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-300 bg-slate-100 shadow-sm ${className}`}>
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0`}
        title={`Invoice ${invoice.invoiceNumber} PDF preview`}
        className="h-[min(85vh,1050px)] w-full bg-white"
      />
    </div>
  );
}
