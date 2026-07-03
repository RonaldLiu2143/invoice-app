"use client";

import Link from "next/link";
import { DollarSign, FileText, AlertCircle, TrendingUp, Plus } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/EmptyState";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
} from "@/lib/calculations";

export default function DashboardPage() {
  const { data, isLoaded, getCustomer, getEffectiveStatus } = useInvoice();

  if (!isLoaded) return <LoadingState />;

  const invoicesWithStatus = data.invoices.map((inv) => ({
    ...inv,
    effectiveStatus: getEffectiveStatus(inv),
  }));

  const totalRevenue = invoicesWithStatus
    .filter((inv) => inv.effectiveStatus === "paid")
    .reduce(
      (sum, inv) => sum + calculateTotals(inv.lineItems, inv.taxRate).total,
      0
    );

  const unpaidInvoices = invoicesWithStatus.filter(
    (inv) => inv.effectiveStatus !== "paid"
  );

  const unpaidTotal = unpaidInvoices.reduce(
    (sum, inv) => sum + calculateTotals(inv.lineItems, inv.taxRate).total,
    0
  );

  const overdueCount = invoicesWithStatus.filter(
    (inv) => inv.effectiveStatus === "overdue"
  ).length;

  const recentInvoices = [...data.invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Unpaid Amount",
      value: formatCurrency(unpaidTotal),
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Unpaid Invoices",
      value: unpaidInvoices.length.toString(),
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Overdue",
      value: overdueCount.toString(),
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Overview of your invoicing activity
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="!p-5">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Invoices
          </h2>
          <Link
            href="/invoices"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            View all
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No invoices yet. Create your first invoice to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => {
                  const customer = getCustomer(inv.customerId);
                  const totals = calculateTotals(inv.lineItems, inv.taxRate);
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          #{inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-700">
                        {customer?.name ?? "—"}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(totals.total)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={getEffectiveStatus(inv)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
