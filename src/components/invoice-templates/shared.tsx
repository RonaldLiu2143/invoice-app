import {
  calculateTotals,
  formatCurrency,
  formatDate,
  lineItemTotal,
  getAmountPaid,
  getBalanceDue,
} from "@/lib/calculations";
import type { InvoiceTemplateProps } from "./types";

export function LineItemsTable({
  invoice,
  headClass,
  rowClass,
  compact,
}: Pick<InvoiceTemplateProps, "invoice" | "compact"> & {
  headClass: string;
  rowClass?: string;
}) {
  const pad = compact ? "px-3 py-2" : "px-6 py-3";
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={headClass}>
          <th className={`${pad} text-left font-medium`}>Description</th>
          <th className={`${pad} text-right font-medium`}>Qty</th>
          <th className={`${pad} text-right font-medium`}>Price</th>
          <th className={`${pad} text-right font-medium`}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {invoice.lineItems.map((item) => (
          <tr key={item.id} className={rowClass}>
            <td className={pad}>{item.description}</td>
            <td className={`${pad} text-right`}>{item.quantity}</td>
            <td className={`${pad} text-right`}>
              {formatCurrency(item.unitPrice)}
            </td>
            <td className={`${pad} text-right font-medium`}>
              {formatCurrency(lineItemTotal(item))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TotalsBlock({
  invoice,
  totals,
  labelClass,
  totalClass,
  compact,
}: Pick<InvoiceTemplateProps, "invoice" | "totals" | "compact"> & {
  labelClass?: string;
  totalClass?: string;
}) {
  const width = compact ? "w-full" : "w-56";
  const amountPaid = getAmountPaid(invoice);
  const balanceDue = getBalanceDue(invoice);

  return (
    <div className={`ml-auto ${width} space-y-1 text-sm`}>
      <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
        <span>Subtotal</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
        <span>Tax ({invoice.taxRate}%)</span>
        <span>{formatCurrency(totals.tax)}</span>
      </div>
      <div
        className={`flex justify-between border-t pt-2 font-bold ${totalClass ?? "text-slate-900"}`}
      >
        <span>Total</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
      {amountPaid > 0 && (
        <>
          <div className={`flex justify-between ${labelClass ?? "text-slate-600"}`}>
            <span>Paid</span>
            <span>-{formatCurrency(amountPaid)}</span>
          </div>
          <div
            className={`flex justify-between border-t pt-2 font-bold ${totalClass ?? "text-slate-900"}`}
          >
            <span>Balance due</span>
            <span>{formatCurrency(balanceDue)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function CompanyBlock({
  settings,
  className,
}: {
  settings: InvoiceTemplateProps["settings"];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-semibold">{settings.name}</p>
      {settings.email && <p className="text-sm opacity-80">{settings.email}</p>}
      {settings.phone && <p className="text-sm opacity-80">{settings.phone}</p>}
      {settings.address && (
        <p className="text-sm opacity-80 whitespace-pre-line">{settings.address}</p>
      )}
    </div>
  );
}

export function CustomerBlock({
  customer,
  className,
}: {
  customer: InvoiceTemplateProps["customer"];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-semibold">{customer.name}</p>
      {customer.email && <p className="text-sm opacity-80">{customer.email}</p>}
      {customer.phone && <p className="text-sm opacity-80">{customer.phone}</p>}
      {customer.address && (
        <p className="text-sm opacity-80 whitespace-pre-line">{customer.address}</p>
      )}
    </div>
  );
}

export function InvoiceMeta({
  invoice,
  status,
  compact,
}: Pick<InvoiceTemplateProps, "invoice" | "status" | "compact">) {
  const text = compact ? "text-xs" : "text-sm";
  return (
    <div className={`${text} space-y-0.5`}>
      <p>
        <span className="opacity-70">Invoice #</span> {invoice.invoiceNumber}
      </p>
      <p>
        <span className="opacity-70">Issued</span> {formatDate(invoice.issueDate)}
      </p>
      <p>
        <span className="opacity-70">Due</span> {formatDate(invoice.dueDate)}
      </p>
      <p className="capitalize">
        <span className="opacity-70">Status</span> {status}
      </p>
    </div>
  );
}

export function useInvoiceTemplateData(props: InvoiceTemplateProps) {
  return {
    ...props,
    totals: props.totals ?? calculateTotals(props.invoice.lineItems, props.invoice.taxRate),
  };
}
