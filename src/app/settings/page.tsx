"use client";

import { useEffect, useState } from "react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card, CardHeader } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { TemplatePicker } from "@/components/TemplatePicker";
import { LoadingState } from "@/components/EmptyState";
import type { InvoiceTemplateId } from "@/lib/types";

export default function SettingsPage() {
  const { data, isLoaded, updateSettings } = useInvoice();
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>("classic");

  useEffect(() => {
    if (isLoaded) {
      setTemplateId(data.settings.templateId ?? "classic");
    }
  }, [isLoaded, data.settings.templateId]);

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
      templateId,
    });
    alert("Settings saved!");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your business details and default invoice template"
      />

      <Card className="mb-6">
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
            <h3 className="mb-3 text-sm font-medium text-slate-700">
              Default Invoice Template
            </h3>
            <TemplatePicker
              value={templateId}
              onChange={setTemplateId}
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
