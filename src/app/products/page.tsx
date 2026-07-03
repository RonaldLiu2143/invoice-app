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
import { formatCurrency } from "@/lib/calculations";
import { matchesProduct } from "@/lib/search";
import type { Product } from "@/lib/types";

const emptyForm = { name: "", description: "", price: "", serialNumber: "" };

export default function ProductsPage() {
  const { data, isLoaded, addProduct, updateProduct, deleteProduct } =
    useInvoice();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  if (!isLoaded) return <LoadingState />;

  const filteredProducts = data.products.filter((product) =>
    matchesProduct(product, debouncedSearch)
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      serialNumber: product.serialNumber ?? "",
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      serialNumber: form.serialNumber.trim() || undefined,
    };
    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      addProduct(payload);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this product?")) deleteProduct(id);
  };

  return (
    <div>
      <PageHeader
        title="Products & Services"
        description="Manage items you bill for on invoices"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title={editingId ? "Edit Product" : "New Product / Service"}
          />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Price *"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Serial Number (S/N)"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="Default S/N for this product"
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">
                {editingId ? "Save Changes" : "Add Product"}
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

      {data.products.length > 0 && (
        <Card className="mb-6 !p-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, description, or price..."
          />
          <SearchResultsHint
            query={search}
            resultCount={filteredProducts.length}
            totalCount={data.products.length}
          />
        </Card>
      )}

      {data.products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add products or services to quickly add them to invoices."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          }
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No results"
          description="Try a different product name, description, or price."
        />
      ) : (
        <Card className="!p-0">
          <TableScroll>
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium sm:px-6">Name</th>
                  <th className="px-3 py-3 font-medium sm:px-6">S/N</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Description</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Price</th>
                  <th className="px-3 py-3 text-right font-medium sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900 sm:px-6">
                      {product.name}
                    </td>
                    <td className="px-3 py-4 text-slate-600 sm:px-6">
                      {product.serialNumber || "—"}
                    </td>
                    <td className="px-3 py-4 text-slate-600 sm:px-6">
                      {product.description}
                    </td>
                    <td className="px-3 py-4 font-medium sm:px-6">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-3 py-4 text-right sm:px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="!p-2"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="!p-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
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
