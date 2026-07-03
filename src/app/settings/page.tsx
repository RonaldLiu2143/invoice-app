"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useInvoice } from "@/context/InvoiceContext";
import { Card, CardHeader } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { TemplatePicker } from "@/components/TemplatePicker";
import { LogoUpload } from "@/components/LogoUpload";
import { LoadingState } from "@/components/EmptyState";
import { downloadBackup, parseBackupFile } from "@/lib/backup";
import type { InvoiceTemplateId } from "@/lib/types";

export default function SettingsPage() {
  const { data, isLoaded, updateSettings, importAppData } = useInvoice();
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>("classic");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded) {
      setTemplateId(data.settings.templateId ?? "classic");
      setLogoDataUrl(data.settings.logoDataUrl);
    }
  }, [isLoaded, data.settings.templateId, data.settings.logoDataUrl]);

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
      defaultTerms: (formData.get("defaultTerms") as string) || undefined,
      defaultNotes: (formData.get("defaultNotes") as string) || undefined,
      templateId,
      logoDataUrl,
    });
    alert("Settings saved!");
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    setImportError("");
    try {
      const text = await files[0].text();
      const imported = parseBackupFile(text);
      if (
        !confirm(
          "Import will replace all current customers, products, invoices, and settings. Continue?"
        )
      ) {
        return;
      }
      importAppData(imported);
      alert("Backup imported successfully.");
    } catch {
      setImportError("Could not read backup file. Make sure it is a valid InvoiceApp backup.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your business details, logo, and data backup"
      />

      <Card className="mb-6">
        <CardHeader
          title="Company Information"
          description="This appears on your invoices, quotes, and PDFs"
        />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <LogoUpload logoDataUrl={logoDataUrl} onChange={setLogoDataUrl} />
          </div>

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
            <Textarea
              label="Default Notes (new invoices & quotes)"
              name="defaultNotes"
              defaultValue={settings.defaultNotes ?? ""}
              rows={2}
              placeholder="Thank you message, etc."
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Default Terms & Conditions"
              name="defaultTerms"
              defaultValue={settings.defaultTerms ?? ""}
              rows={3}
              placeholder="Payment due upon completion, warranty terms, etc."
            />
          </div>

          <div className="sm:col-span-2">
            <h3 className="mb-3 text-sm font-medium text-slate-700">
              Default Invoice Template
            </h3>
            <TemplatePicker value={templateId} onChange={setTemplateId} />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Backup & Restore"
          description="Export your data to a file or restore from a previous backup"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => downloadBackup(data)}>
            <Download className="h-4 w-4" />
            Export Backup
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files)}
          />
        </div>
        {importError && (
          <p className="mt-3 text-sm text-red-600">{importError}</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Back up regularly — data is stored in this browser only.
        </p>
      </Card>
    </div>
  );
}
