import type { InvoiceStatus } from "@/lib/types";

const statusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-sky-100 text-sky-800",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
