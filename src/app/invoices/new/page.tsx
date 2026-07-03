"use client";

import Link from "next/link";
import { useInvoice } from "@/context/InvoiceContext";
import { InvoiceForm } from "@/components/InvoiceForm";
import { LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function NewInvoicePage() {
  const { data, isLoaded } = useInvoice();

  if (!isLoaded) return <LoadingState />;

  if (data.customers.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <p className="mt-2 text-slate-500">
          You need at least one customer before creating an invoice.
        </p>
        <Link href="/customers" className="mt-6 inline-block">
          <Button>Add Customer First</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <p className="mt-1 text-slate-500">
          Create a new invoice for a customer
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
