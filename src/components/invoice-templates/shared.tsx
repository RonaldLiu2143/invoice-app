import type { Customer, CompanySettings, Invoice, JobPhoto } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  lineItemTotal,
  isFlatPriceItem,
  getAmountPaid,
  getBalanceDue,
  documentLabel,
  isQuote,
} from "@/lib/calculations";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
import type { InvoiceTemplateProps } from "./types";
import { MIN_LINE_ITEM_ROWS } from "@/lib/invoice-layout";

export { MIN_LINE_ITEM_ROWS };

export function documentTitle(invoice: Invoice): string {
  return isQuote(invoice) ? "QUOTE" : "INVOICE";
}

export function CompanyLogo({
  settings,
  className = "h-14 max-w-[180px] object-contain",
}: {
  settings: CompanySettings;
  className?: string;
}) {
  if (!settings.logoDataUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={settings.logoDataUrl} alt={settings.name} className={className} />
  );
}

function lineDescription(item: Invoice["lineItems"][number]): string {
  if (!item.serialNumber?.trim()) return item.description;
  return `${item.description}${item.description ? "\n" : ""}S/N: ${item.serialNumber}`;
}

function paddedLineItems(invoice: Invoice) {
  const rows = invoice.lineItems.map((item) => ({
    id: item.id,
    description: lineDescription(item),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: lineItemTotal(item),
    isFlat: isFlatPriceItem(item),
    isEmpty: false,
  }));

  while (rows.length < MIN_LINE_ITEM_ROWS) {
    rows.push({
      id: `empty-${rows.length}`,
      description: "",
      quantity: 0,
      unitPrice: 0,
      amount: 0,
      isFlat: false,
      isEmpty: true,
    });
  }
  return rows;
}

export function LineItemsTable({
  invoice,
  headClass,
  rowClass,
  compact,
  borderClass = "border border-slate-300",
}: Pick<InvoiceTemplateProps, "invoice" | "compact"> & {
  headClass: string;
  rowClass?: string;
  borderClass?: string;
}) {
  const pad = compact ? "px-3 py-2" : "px-3 py-3 sm:px-4 sm:py-3";
  const rows = paddedLineItems(invoice);

  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[360px] border-collapse text-sm ${borderClass}`}>
        <thead>
          <tr className={headClass}>
            <th className={`${pad} border border-inherit text-left font-medium`}>
              Description
            </th>
            <th className={`${pad} border border-inherit text-right font-medium`}>
              Qty
            </th>
            <th className={`${pad} border border-inherit text-right font-medium`}>
              Unit Price
            </th>
            <th className={`${pad} border border-inherit text-right font-medium`}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`${rowClass ?? ""} ${row.isEmpty ? "h-9" : ""}`}
            >
              <td className={`${pad} border border-slate-200 whitespace-pre-line`}>
                {row.description}
              </td>
              <td className={`${pad} border border-slate-200 text-right`}>
                {row.isEmpty ? "" : row.isFlat ? "—" : row.quantity}
              </td>
              <td className={`${pad} border border-slate-200 text-right`}>
                {row.isEmpty ? "" : row.isFlat ? "Flat" : formatCurrency(row.unitPrice)}
              </td>
              <td className={`${pad} border border-slate-200 text-right font-medium`}>
                {row.isEmpty ? "" : formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TotalsBlock({
  invoice,
  totals,
  labelClass,
  totalClass,
  compact,
  boxClass = "rounded-lg border-2 border-slate-300 bg-slate-50 p-4",
}: Pick<InvoiceTemplateProps, "invoice" | "totals" | "compact"> & {
  labelClass?: string;
  totalClass?: string;
  boxClass?: string;
}) {
  const amountPaid = getAmountPaid(invoice);
  const balanceDue = getBalanceDue(invoice);

  return (
    <div className={`ml-auto w-full space-y-1 text-sm sm:w-64 ${boxClass}`}>
      <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
        <span>Subtotal</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
          <span>Discount</span>
          <span>-{formatCurrency(totals.discount)}</span>
        </div>
      )}
      <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
        <span>Tax ({invoice.taxRate}%)</span>
        <span>{formatCurrency(totals.tax)}</span>
      </div>
      <div
        className={`flex justify-between border-t border-slate-300 pt-2 font-bold ${totalClass ?? "text-slate-900"}`}
      >
        <span>Total</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
      {amountPaid > 0 && !isQuote(invoice) && (
        <div
          className={`flex justify-between border-t border-slate-300 pt-2 font-bold ${totalClass ?? "text-slate-900"}`}
        >
          <span>Balance due</span>
          <span>{formatCurrency(balanceDue)}</span>
        </div>
      )}
    </div>
  );
}

function PartyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value.trim() || "—"}</span>
    </div>
  );
}

export function PartyInfoBox({
  title,
  values,
  className = "",
  titleClass = "text-blue-800",
  borderClass = "border-2 border-blue-200 bg-slate-50",
}: {
  title: string;
  values: { name: string; email: string; phone: string; address: string };
  className?: string;
  titleClass?: string;
  borderClass?: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${borderClass} ${className}`}>
      <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${titleClass}`}>
        {title}
      </p>
      <div className="space-y-2">
        <PartyField label="Name" value={values.name} />
        <PartyField label="Email" value={values.email} />
        <PartyField label="Phone" value={values.phone} />
        <PartyField label="Address" value={values.address} />
      </div>
    </div>
  );
}

export function CompanyBlock({
  settings,
  className,
}: {
  settings: CompanySettings;
  className?: string;
}) {
  return (
    <PartyInfoBox
      title="From (Company)"
      values={settings}
      className={className}
    />
  );
}

export function CustomerBlock({
  customer,
  className,
  title = "Bill To (Customer)",
}: {
  customer: Customer;
  className?: string;
  title?: string;
}) {
  return (
    <PartyInfoBox
      title={title}
      values={customer}
      className={className}
    />
  );
}

export function InvoiceMeta({
  invoice,
  status,
  compact,
  boxClass = "rounded-lg border-2 border-slate-300 bg-white p-4",
}: Pick<InvoiceTemplateProps, "invoice" | "status" | "compact"> & {
  boxClass?: string;
}) {
  const label = documentLabel(invoice);
  const text = compact ? "text-xs" : "text-sm";
  return (
    <div className={`${text} ${boxClass}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p>
            <span className="text-slate-500">{label} #</span>{" "}
            <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span>
          </p>
          {invoice.jobReference?.trim() && (
            <p>
              <span className="text-slate-500">Job / PO</span>{" "}
              <span className="font-medium text-slate-900">
                {invoice.jobReference.trim()}
              </span>
            </p>
          )}
          <p>
            <span className="text-slate-500">Issued</span> {formatDate(invoice.issueDate)}
          </p>
          {!isQuote(invoice) && (
            <p>
              <span className="text-slate-500">Due</span> {formatDate(invoice.dueDate)}
            </p>
          )}
        </div>
        <DocumentStatusBadge invoice={invoice} status={status} size="lg" />
      </div>
    </div>
  );
}

export function TermsBlock({ terms }: { terms?: string }) {
  if (!terms?.trim()) return null;
  return (
    <div className="mt-6 rounded-lg border-2 border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      <p className="mb-1 font-semibold text-slate-800">Terms & Conditions</p>
      <p className="whitespace-pre-wrap">{terms}</p>
    </div>
  );
}

export function NotesBlock({ notes }: { notes?: string }) {
  if (!notes?.trim()) return null;
  return (
    <div className="mt-6 rounded-lg border-2 border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      <p className="mb-1 font-semibold text-slate-800">Notes</p>
      <p className="whitespace-pre-wrap">{notes}</p>
    </div>
  );
}

export function PaymentHistoryGrid({ invoice }: { invoice: Invoice }) {
  if (isQuote(invoice)) return null;
  const payments = [...(invoice.payments ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (payments.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-semibold text-slate-800">Payment History</p>
      <div className="overflow-x-auto rounded-lg border-2 border-slate-300">
        <table className="w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">Amount</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 text-slate-800">{formatDate(payment.date)}</td>
                <td className="px-3 py-2 text-right text-slate-800">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-3 py-2 text-slate-600">{payment.note?.trim() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function JobPhotosGrid({
  photos,
  maxPhotos = 6,
  compact = false,
}: {
  photos: JobPhoto[];
  maxPhotos?: number;
  compact?: boolean;
}) {
  const shown = photos.slice(0, maxPhotos);
  if (shown.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-800">Job Photos</p>
      <div
        className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        {shown.map((photo) => (
          <div
            key={photo.id}
            className="overflow-hidden rounded-lg border border-slate-300 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt={photo.caption || "Job photo"}
              className={compact ? "h-28 w-full object-cover" : "h-40 w-full object-cover"}
            />
            <div className="border-t border-slate-200 p-2 text-xs">
              <p className="text-slate-700">{photo.caption.trim() || "Job photo"}</p>
              {photo.showSerialNumber && photo.serialNumber.trim() && (
                <p className="mt-0.5 font-semibold text-slate-900">
                  S/N: {photo.serialNumber.trim()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
