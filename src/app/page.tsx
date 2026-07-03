"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DollarSign, FileText, AlertCircle, TrendingUp, Plus } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TableScroll } from "@/components/TableScroll";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/EmptyState";
import {
  formatCurrency,
  formatDate,
  getAmountPaid,
  getBalanceDue,
  resolveInvoiceStatus,
} from "@/lib/calculations";

export default function DashboardPage() {
  const { data, isLoaded, getCustomer } = useInvoice();

  const dashboard = useMemo(() => {
    const invoices = data.invoices.map((invoice) => ({
      invoice,
      status: resolveInvoiceStatus(invoice),
      amountPaid: getAmountPaid(invoice),
      balanceDue: getBalanceDue(invoice),
    }));

    const totalRevenue = invoices.reduce((sum, row) => sum + row.amountPaid, 0);
    const unpaidRows = invoices.filter((row) => row.balanceDue > 0);
    const unpaidTotal = unpaidRows.reduce((sum, row) => sum + row.balanceDue, 0);
    const overdueCount = invoices.filter((row) => row.status === "overdue").length;

    const recentInvoices = [...invoices]
      .sort(
        (a, b) =>
          new Date(b.invoice.createdAt).getTime() -
          new Date(a.invoice.createdAt).getTime()
      )
      .slice(0, 5);

    return {
      totalRevenue,
      unpaidTotal,
      unpaidCount: unpaidRows.length,
      overdueCount,
      recentInvoices,
    };
  }, [data.invoices]);

  if (!isLoaded) return <LoadingState />;

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(dashboard.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Unpaid Amount",
      value: formatCurrency(dashboard.unpaidTotal),
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Unpaid Invoices",
      value: dashboard.unpaidCount.toString(),
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Overdue",
      value: dashboard.overdueCount.toString(),
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity"
        action={
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        }
      />

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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        {dashboard.recentInvoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No invoices yet. Create your first invoice to get started.
          </p>
        ) : (
          <TableScroll>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Balance</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentInvoices.map(({ invoice, status, balanceDue }) => {
                  const customer = getCustomer(invoice.customerId);
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          #{invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-700">
                        {customer?.name ?? "—"}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(balanceDue)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>
    </div>
  );
}
