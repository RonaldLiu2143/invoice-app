"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import type { Invoice } from "@/lib/types";
import {
  formatCurrency,
  getAmountPaid,
  getBalanceDue,
  calculateInvoiceTotals,
  PAYMENT_TOLERANCE,
  todayISO,
} from "@/lib/calculations";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";

export function PaymentPanel({
  invoice,
  onAddPayment,
  onPayInFull,
}: {
  invoice: Invoice;
  onAddPayment: (amount: number, date: string, note: string) => void;
  onPayInFull: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const totals = calculateInvoiceTotals(invoice);
  const amountPaid = getAmountPaid(invoice);
  const balanceDue = getBalanceDue(invoice);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }
    if (value > balanceDue + PAYMENT_TOLERANCE) {
      alert(`Payment cannot exceed the balance due (${formatCurrency(balanceDue)}).`);
      return;
    }
    onAddPayment(value, date, note);
    setAmount("");
    setNote("");
  };

  return (
    <Card className="mb-6">
      <CardHeader
        title="Payments"
        description="Record partial or full payments against this invoice"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Invoice total</p>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Amount paid</p>
          <p className="text-lg font-bold text-emerald-800">
            {formatCurrency(amountPaid)}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Balance due</p>
          <p className="text-lg font-bold text-amber-900">
            {formatCurrency(balanceDue)}
          </p>
        </div>
      </div>

      {balanceDue > 0 && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 border-b border-slate-200 pb-6 sm:grid-cols-2"
        >
          <Input
            label="Payment amount"
            type="number"
            min="0.01"
            step="0.01"
            max={balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Payment date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Check #, transfer ref, etc."
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit">
              <Wallet className="h-4 w-4" />
              Record payment
            </Button>
            <Button type="button" variant="secondary" onClick={onPayInFull}>
              Pay remaining {formatCurrency(balanceDue)}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
