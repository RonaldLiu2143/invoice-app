"use client";

import { Trash2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";

export function PaymentHistoryPanel({
  invoice,
  onRemovePayment,
}: {
  invoice: Invoice;
  onRemovePayment: (paymentId: string) => void;
}) {
  const payments = [...(invoice.payments ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="mb-6">
      <CardHeader
        title="Payment History"
        description="Individual payments recorded for this invoice"
      />
      {payments.length === 0 ? (
        <p className="text-sm text-slate-500">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-sm text-slate-500">
                  {formatDate(payment.date)}
                  {payment.note ? ` · ${payment.note}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="!p-2 text-red-600 hover:bg-red-50"
                onClick={() => onRemovePayment(payment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
