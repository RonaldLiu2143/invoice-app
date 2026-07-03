import { formatDate } from "@/lib/calculations";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyBlock,
  CustomerBlock,
  LineItemsTable,
  TotalsBlock,
} from "./shared";

export function MinimalTemplate(props: InvoiceTemplateProps) {
  const { invoice, customer, settings, status, totals, compact } = props;
  const pad = compact ? "p-4" : "p-4 sm:p-8";

  return (
    <div className={`bg-white ${compact ? "text-xs" : "text-sm"}`}>
      <div className={`flex flex-col gap-2 border-b border-neutral-900 pb-4 sm:flex-row sm:justify-between ${pad}`}>
        <p className={`font-medium tracking-[0.2em] ${compact ? "text-sm" : "text-lg"}`}>
          INVOICE
        </p>
        <p className="text-neutral-500">#{invoice.invoiceNumber}</p>
      </div>

      <div className={`grid gap-8 sm:grid-cols-3 ${pad}`}>
        <CompanyBlock settings={settings} className="text-neutral-800" />
        <CustomerBlock customer={customer} className="text-neutral-800" />
        <div className="text-neutral-500">
          <p>{formatDate(invoice.issueDate)}</p>
          <p>Due {formatDate(invoice.dueDate)}</p>
          <p className="capitalize">{status}</p>
        </div>
      </div>

      <LineItemsTable
        invoice={invoice}
        compact={compact}
        headClass="border-b border-t border-neutral-900 text-neutral-900"
        rowClass="border-b border-neutral-200"
      />

      <div className={`${pad} border-t border-neutral-900`}>
        <TotalsBlock
          invoice={invoice}
          totals={totals}
          compact={compact}
          labelClass="text-neutral-500"
          totalClass="text-neutral-900"
        />
        {invoice.notes && (
          <p className="mt-6 text-neutral-500 whitespace-pre-wrap">{invoice.notes}</p>
        )}
      </div>
    </div>
  );
}
