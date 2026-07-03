"use client";

import { useInvoice } from "@/context/InvoiceContext";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { LoadingState } from "@/components/EmptyState";

export default function SettingsPage() {
  const { data, isLoaded, updateSettings } = useInvoice();

  if (!isLoaded) return <LoadingState />;

  const { settings } = data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    updateSettings({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      taxRate: parseFloat(formData.get("taxRate") as string) || 0,
    });
    alert("Settings saved!");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">
          Configure your business details for invoices
        </p>
      </div>

      <Card>
        <CardHeader
          title="Company Information"
          description="This appears on your invoices and PDFs"
        />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Business Name"
            name="name"
            defaultValue={settings.name}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={settings.email}
          />
          <Input
            label="Phone"
            name="phone"
            defaultValue={settings.phone}
          />
          <Input
            label="Default Tax Rate (%)"
            name="taxRate"
            type="number"
            min="0"
            step="0.1"
            defaultValue={settings.taxRate}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Address"
              name="address"
              defaultValue={settings.address}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
