"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormFields";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
} from "@/lib/calculations";

export default function InvoicesPage() {
  const { data, isLoaded, getCustomer, getEffectiveStatus } = useInvoice();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!isLoaded) return <LoadingState />;

  const filtered = data.invoices
    .filter((inv) => {
      const customer = getCustomer(inv.customerId);
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.includes(q) ||
        customer?.name.toLowerCase().includes(q) ||
        customer?.email.toLowerCase().includes(q);
      const status = getEffectiveStatus(inv);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-slate-500">
            Search and manage all your invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card className="mb-6 !p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by invoice #, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={data.invoices.length === 0 ? "No invoices yet" : "No results"}
          description={
            data.invoices.length === 0
              ? "Create your first invoice to get started."
              : "Try adjusting your search or filters."
          }
          action={
            data.invoices.length === 0 ? (
              <Link href="/invoices/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  New Invoice
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-6 py-3 font-medium">Invoice #</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Issue Date</th>
                <th className="px-6 py-3 font-medium">Due Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const customer = getCustomer(inv.customerId);
                const totals = calculateTotals(inv.lineItems, inv.taxRate);
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {customer?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(totals.total)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getEffectiveStatus(inv)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
