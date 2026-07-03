import { Suspense } from "react";
import { LoadingState } from "@/components/EmptyState";
import NewInvoicePageClient from "./NewInvoicePageClient";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewInvoicePageClient />
    </Suspense>
  );
}
