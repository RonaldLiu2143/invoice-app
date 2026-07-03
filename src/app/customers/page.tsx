"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Card, CardHeader } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TableScroll } from "@/components/TableScroll";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { SearchBar, SearchResultsHint } from "@/components/SearchBar";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { matchesCustomer } from "@/lib/search";
import type { Customer } from "@/lib/types";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function CustomersPage() {
  const { data, isLoaded, addCustomer, updateCustomer, deleteCustomer } =
    useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  if (!isLoaded) return <LoadingState />;

  const filteredCustomers = data.customers.filter((customer) =>
    matchesCustomer(customer, debouncedSearch)
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (customer: Customer) => {
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateCustomer(editingId, form);
    } else {
      addCustomer(form);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this customer?")) deleteCustomer(id);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer contacts"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title={editingId ? "Edit Customer" : "New Customer"}
          />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Textarea
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">
                {editingId ? "Save Changes" : "Add Customer"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {data.customers.length > 0 && (
        <Card className="mb-6 !p-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, phone, or address..."
          />
          <SearchResultsHint
            query={search}
            resultCount={filteredCustomers.length}
            totalCount={data.customers.length}
          />
        </Card>
      )}

      {data.customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start creating invoices."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          }
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No results"
          description="Try a different name, phone number, email, or address."
        />
      ) : (
        <Card className="!p-0">
          <TableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium sm:px-6">Name</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Email</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Phone</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Address</th>
                  <th className="px-3 py-3 text-right font-medium sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900 sm:px-6">
                      {customer.name}
                    </td>
                    <td className="px-3 py-4 text-slate-600 sm:px-6">{customer.email}</td>
                    <td className="px-3 py-4 text-slate-600 sm:px-6">{customer.phone}</td>
                    <td className="px-3 py-4 text-slate-600 sm:px-6">{customer.address}</td>
                    <td className="px-3 py-4 text-right sm:px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="!p-2"
                        onClick={() => openEdit(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="!p-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </TableScroll>
        </Card>
      )}
    </div>
  );
}
