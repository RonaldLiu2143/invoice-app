"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { InvoiceStatus } from "@/lib/types";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TableScroll } from "@/components/TableScroll";
import { Button } from "@/components/Button";
import { SearchBar, SearchResultsHint } from "@/components/SearchBar";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  getBalanceDue,
} from "@/lib/calculations";
import { matchesInvoice } from "@/lib/search";

export default function InvoicesPage() {
  const { data, isLoaded, getCustomer, getEffectiveStatus } = useInvoice();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const debouncedSearch = useDebouncedValue(search);

  if (!isLoaded) return <LoadingState />;

  const filtered = useMemo(
    () =>
      data.invoices
        .filter((inv) => {
          const customer = getCustomer(inv.customerId);
          const matchesSearchQuery = matchesInvoice(inv, customer, debouncedSearch);
          const status = getEffectiveStatus(inv);
          const matchesStatus =
            statusFilter === "all" || status === statusFilter;
          return matchesSearchQuery && matchesStatus;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [data.invoices, debouncedSearch, statusFilter, getCustomer, getEffectiveStatus]
  );

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Search and manage all your invoices"
        action={
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        }
      />

      <Card className="mb-6 !p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search invoices..."
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | InvoiceStatus)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <SearchResultsHint
          query={search}
          resultCount={filtered.length}
          totalCount={data.invoices.length}
        />
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
        <Card className="!p-0">
          <TableScroll>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium sm:px-6">Invoice #</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Customer</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Issue Date</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Due Date</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Total</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Balance</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Status</th>
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
                      <td className="px-3 py-4 sm:px-6">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          #{inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-slate-700 sm:px-6">
                        {customer?.name ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-slate-500 sm:px-6">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-3 py-4 text-slate-500 sm:px-6">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-3 py-4 font-medium sm:px-6">
                        {formatCurrency(totals.total)}
                      </td>
                      <td className="px-3 py-4 font-medium sm:px-6">
                        {formatCurrency(getBalanceDue(inv))}
                      </td>
                      <td className="px-3 py-4 sm:px-6">
                      <StatusBadge status={getEffectiveStatus(inv)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </TableScroll>
        </Card>
      )}
    </div>
  );
}
