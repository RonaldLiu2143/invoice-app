"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInvoice } from "@/context/InvoiceContext";
import { InvoiceForm } from "@/components/InvoiceForm";
import { LoadingState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import type { DocumentType } from "@/lib/types";

export default function NewInvoicePageClient() {
  const { isLoaded } = useInvoice();
  const searchParams = useSearchParams();
  const documentType: DocumentType =
    searchParams.get("type") === "quote" ? "quote" : "invoice";
  const isQuote = documentType === "quote";

  if (!isLoaded) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title={isQuote ? "New Quote" : "New Invoice"}
        description={
          isQuote
            ? "Create an estimate for your customer — convert to an invoice when approved"
            : "Create a new invoice — type a customer name or pick from your list"
        }
      />
      <InvoiceForm documentType={documentType} />
    </div>
  );
}
