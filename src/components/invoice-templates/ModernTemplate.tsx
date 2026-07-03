import { StatusBadge } from "@/components/StatusBadge";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyBlock,
  CustomerBlock,
  InvoiceMeta,
  LineItemsTable,
  TotalsBlock,
} from "./shared";

export function ModernTemplate(props: InvoiceTemplateProps) {
  const { invoice, customer, settings, status, totals, compact } = props;
  const pad = compact ? "p-4" : "p-8";

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-indigo-100 ${compact ? "text-xs" : ""}`}>
      <div className={`bg-gradient-to-r from-indigo-600 to-violet-500 ${pad} text-white`}>
        <div className="flex justify-between gap-4">
          <div>
            <p className={`font-bold ${compact ? "text-lg" : "text-2xl"}`}>{settings.name}</p>
            <p className="mt-1 text-sm text-indigo-100">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            {!compact && <StatusBadge status={status} />}
            <p className={`font-semibold ${compact ? "text-lg" : "text-xl"} mt-1`}>
              Invoice
            </p>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${pad}`}>
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-indigo-600">From</p>
          <CompanyBlock settings={settings} className="text-slate-700" />
        </div>
        <div className="rounded-xl bg-violet-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-violet-600">Bill To</p>
          <CustomerBlock customer={customer} className="text-slate-700" />
        </div>
      </div>

      <div className="px-8 pb-2">
        <InvoiceMeta invoice={invoice} status={status} compact={compact} />
      </div>

      <LineItemsTable
        invoice={invoice}
        compact={compact}
        headClass="bg-indigo-50 text-indigo-900"
        rowClass="border-b border-indigo-50"
      />

      <div className={pad}>
        <TotalsBlock
          invoice={invoice}
          totals={totals}
          compact={compact}
          labelClass="text-slate-600"
          totalClass="text-indigo-700 text-base"
        />
        {invoice.notes && (
          <p className="mt-4 text-sm text-slate-500 whitespace-pre-wrap">{invoice.notes}</p>
        )}
      </div>
    </div>
  );
}
