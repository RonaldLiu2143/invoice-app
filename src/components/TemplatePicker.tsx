"use client";

import type { InvoiceTemplateId } from "@/lib/types";
import { INVOICE_TEMPLATES } from "@/lib/templates";
import { InvoicePreview } from "./invoice-templates";
import type { InvoiceTemplateProps } from "./invoice-templates/types";

export function TemplatePicker({
  value,
  onChange,
  previewProps,
}: {
  value: InvoiceTemplateId;
  onChange: (id: InvoiceTemplateId) => void;
  previewProps?: InvoiceTemplateProps;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {INVOICE_TEMPLATES.map((template) => {
        const selected = value === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
              selected
                ? "border-blue-600 ring-2 ring-blue-100"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="pointer-events-none max-h-48 overflow-hidden">
              {previewProps ? (
                <InvoicePreview
                  templateId={template.id}
                  {...previewProps}
                  compact
                />
              ) : (
                <div
                  className="flex h-32 items-center justify-center text-sm font-medium text-slate-500"
                  style={{
                    background:
                      template.id === "bold"
                        ? "#0f172a"
                        : template.id === "modern"
                          ? "linear-gradient(135deg,#4f46e5,#8b5cf6)"
                          : template.id === "elegant"
                            ? "#fffbeb"
                            : "#f8fafc",
                    color:
                      template.id === "bold" || template.id === "modern"
                        ? "#fff"
                        : "#334155",
                  }}
                >
                  {template.name}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 bg-white p-3">
              <p className="font-medium text-slate-900">{template.name}</p>
              <p className="text-xs text-slate-500">{template.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
