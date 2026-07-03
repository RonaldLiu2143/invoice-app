import type { Invoice, InvoiceStatus } from "@/lib/types";
import { isQuote } from "@/lib/calculations";
import { StatusBadge } from "@/components/StatusBadge";

export function DocumentStatusBadge({
  invoice,
  status,
  size = "sm",
}: {
  invoice: Invoice;
  status: InvoiceStatus;
  size?: "sm" | "lg";
}) {
  if (isQuote(invoice)) {
    const large = size === "lg";
    return (
      <span
        className={`inline-flex items-center border border-violet-300 bg-violet-100 font-bold uppercase tracking-wide text-violet-800 ${
          large
            ? "rounded-lg px-4 py-2 text-base"
            : "rounded-full px-2.5 py-0.5 text-xs"
        }`}
      >
        Quote
      </span>
    );
  }
  return <StatusBadge status={status} size={size} />;
}
