import type { InvoiceStatus } from "@/lib/types";

const statusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  unpaid: "bg-amber-100 text-amber-800 border-amber-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  partial: "bg-sky-100 text-sky-800 border-sky-300",
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: InvoiceStatus;
  size?: "sm" | "lg";
}) {
  const large = size === "lg";
  return (
    <span
      className={`inline-flex items-center border font-bold capitalize ${
        large
          ? "rounded-lg px-4 py-2 text-base tracking-wide"
          : "rounded-full px-2.5 py-0.5 text-xs font-medium"
      } ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
