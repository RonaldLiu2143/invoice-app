import { StatusBadge } from "@/components/StatusBadge";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyBlock,
  CustomerBlock,
  InvoiceMeta,
  LineItemsTable,
  TotalsBlock,
} from "./shared";

export function ClassicTemplate(props: InvoiceTemplateProps) {
  const { invoice, customer, settings, status, totals, compact } = props;
  const pad = compact ? "p-4" : "p-8";

  return (
    <div className={`bg-white ${compact ? "text-xs" : ""}`}>
      <div className={`flex justify-between gap-4 border-b-4 border-blue-800 ${pad}`}>
        <div>
          <h2 className={`font-bold text-blue-800 ${compact ? "text-lg" : "text-3xl"}`}>
            INVOICE
          </h2>
          <div className="mt-2">
            <CompanyBlock settings={settings} className="text-slate-600" />
          </div>
        </div>
        <div className="text-right">
          <InvoiceMeta invoice={invoice} status={status} compact={compact} />
          {!compact && <div className="mt-2 flex justify-end"><StatusBadge status={status} /></div>}
        </div>
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 ${pad}`}>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
            Bill To
          </p>
          <CustomerBlock customer={customer} className="text-slate-700" />
        </div>
      </div>

      <LineItemsTable
        invoice={invoice}
        compact={compact}
        headClass="bg-blue-800 text-white"
        rowClass="border-b border-slate-100"
      />

      <div className={pad}>
        <TotalsBlock invoice={invoice} totals={totals} compact={compact} totalClass="text-blue-800 text-base" />
        {invoice.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-1 font-semibold text-slate-800">Notes</p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
