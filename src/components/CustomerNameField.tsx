"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import type { Customer } from "@/lib/types";
import { Button } from "@/components/Button";

export function CustomerNameField({
  customers,
  customerId,
  customerName,
  onCustomerIdChange,
  onCustomerNameChange,
  onAddCustomer,
}: {
  customers: Customer[];
  customerId: string;
  customerName: string;
  onCustomerIdChange: (id: string) => void;
  onCustomerNameChange: (name: string) => void;
  onAddCustomer: (name: string) => Customer;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = customerName.trim().toLowerCase();
    if (!query) return customers.slice(0, 8);
    return customers
      .filter((customer) => customer.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [customers, customerName]);

  const linkedCustomer = customers.find((customer) => customer.id === customerId);
  const exactMatch = customers.find(
    (customer) =>
      customer.name.trim().toLowerCase() === customerName.trim().toLowerCase()
  );
  const showAddButton =
    customerName.trim().length > 0 && !exactMatch && !customerId;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectCustomer = (customer: Customer) => {
    onCustomerNameChange(customer.name);
    onCustomerIdChange(customer.id);
    setOpen(false);
  };

  const handleAddToList = () => {
    const name = customerName.trim();
    if (!name) return;
    const created = onAddCustomer(name);
    onCustomerIdChange(created.id);
    onCustomerNameChange(created.name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">Customer *</label>
      <div className="relative">
        <input
          type="text"
          value={customerName}
          onChange={(e) => {
            const value = e.target.value;
            onCustomerNameChange(value);
            const match = customers.find(
              (customer) =>
                customer.name.trim().toLowerCase() === value.trim().toLowerCase()
            );
            onCustomerIdChange(match?.id ?? "");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type customer name"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {suggestions.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 active:bg-blue-50"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => selectCustomer(customer)}
                >
                  <span className="font-medium text-slate-900">{customer.name}</span>
                  {customer.phone && (
                    <span className="ml-2 text-slate-500">{customer.phone}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {linkedCustomer && (
        <p className="text-xs text-emerald-700">
          Linked to customer list
          {linkedCustomer.email ? ` · ${linkedCustomer.email}` : ""}
        </p>
      )}

      {showAddButton && (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleAddToList}
        >
          <UserPlus className="h-4 w-4" />
          Add &quot;{customerName.trim()}&quot; to customer list
        </Button>
      )}
    </div>
  );
}
