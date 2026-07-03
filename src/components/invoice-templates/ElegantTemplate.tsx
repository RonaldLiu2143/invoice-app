import { formatDate } from "@/lib/calculations";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyBlock,
  CustomerBlock,
  LineItemsTable,
  TotalsBlock,
} from "./shared";

export function ElegantTemplate(props: InvoiceTemplateProps) {
  const { invoice, customer, settings, status, totals, compact } = props;
  const pad = compact ? "p-4" : "p-4 sm:p-8";

  return (
    <div
      className={`border-2 border-amber-200 bg-amber-50/30 ${compact ? "text-xs" : ""}`}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className={`border-b-2 border-amber-200 ${pad}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div>
            <p className={`text-amber-900 ${compact ? "text-lg" : "text-2xl"}`}>
              {settings.name}
            </p>
            <p className="mt-1 text-sm italic text-amber-800/70">Invoice</p>
          </div>
          <div className="text-right text-sm text-amber-900">
            <p>No. {invoice.invoiceNumber}</p>
            <p className="mt-1">{formatDate(invoice.issueDate)}</p>
            <p className="capitalize">{status}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 ${pad}`}>
        <div className="border border-amber-200 bg-white/60 p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-amber-700">Sender</p>
          <CompanyBlock settings={settings} className="text-stone-700" />
        </div>
        <div className="border border-amber-200 bg-white/60 p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-amber-700">Recipient</p>
          <CustomerBlock customer={customer} className="text-stone-700" />
        </div>
      </div>

      <div className="mx-4 overflow-hidden rounded border border-amber-200 bg-white sm:mx-8">
        <LineItemsTable
          invoice={invoice}
          compact={compact}
          headClass="bg-amber-100 text-amber-950"
          rowClass="border-b border-amber-100"
        />
      </div>

      <div className={pad}>
        <TotalsBlock
          invoice={invoice}
          totals={totals}
          compact={compact}
          labelClass="text-stone-600"
          totalClass="text-amber-900 text-base"
        />
        {invoice.notes && (
          <p className="mt-6 text-center text-sm italic text-stone-600 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        )}
      </div>
    </div>
  );
}
