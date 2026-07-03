import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyBlock,
  CustomerBlock,
  InvoiceMeta,
  LineItemsTable,
  TotalsBlock,
} from "./shared";

export function BoldTemplate(props: InvoiceTemplateProps) {
  const { invoice, customer, settings, status, totals, compact } = props;
  const pad = compact ? "p-4" : "p-8";

  return (
    <div className={`bg-white ${compact ? "text-xs" : ""}`}>
      <div className={`bg-slate-900 ${pad} text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`font-black tracking-tight ${compact ? "text-xl" : "text-4xl"}`}>
              INVOICE
            </p>
            <p className="mt-2 text-slate-300">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            {!compact && <StatusBadge status={status} />}
            <p className={`mt-2 font-bold ${compact ? "text-lg" : "text-2xl"}`}>
              {formatCurrency(totals.total)}
            </p>
            <p className="text-xs text-slate-400">Amount due</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 border-b border-slate-200 sm:grid-cols-2 ${pad}`}>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            From
          </p>
          <CompanyBlock settings={settings} className="text-slate-800" />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Bill To
          </p>
          <CustomerBlock customer={customer} className="text-slate-800" />
        </div>
      </div>

      <div className={`${pad} pb-0`}>
        <InvoiceMeta invoice={invoice} status={status} compact={compact} />
      </div>

      <LineItemsTable
        invoice={invoice}
        compact={compact}
        headClass="bg-slate-900 text-white"
        rowClass="border-b border-slate-200"
      />

      <div className={`${pad} bg-slate-50`}>
        <TotalsBlock
          invoice={invoice}
          totals={totals}
          compact={compact}
          totalClass="text-slate-900 text-base"
        />
        {invoice.notes && (
          <div className="mt-4 border-l-4 border-blue-500 pl-4 text-sm text-slate-600">
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
