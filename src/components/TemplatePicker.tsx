"use client";

import type { CSSProperties } from "react";
import type { InvoiceTemplateId } from "@/lib/types";
import { INVOICE_TEMPLATES } from "@/lib/templates";
import { InvoicePreview } from "./invoice-templates";
import type { InvoiceTemplateProps } from "./invoice-templates/types";

function swatchStyle(templateId: InvoiceTemplateId): CSSProperties {
  const theme = INVOICE_TEMPLATES.find((t) => t.id === templateId)?.theme;
  if (!theme) return { background: "#f8fafc", color: "#334155" };

  if (templateId === "modern") {
    const [r, g, b] = theme.primary;
    const [ar, ag, ab] = theme.accent;
    return {
      background: `linear-gradient(135deg, rgb(${r} ${g} ${b}), rgb(${ar} ${ag} ${ab}))`,
      color: "#fff",
    };
  }

  if (templateId === "bold") {
    const [r, g, b] = theme.headerFill ?? theme.primary;
    return { background: `rgb(${r} ${g} ${b})`, color: "#fff" };
  }

  if (templateId === "elegant") {
    const [r, g, b] = theme.headerFill ?? [255, 251, 235];
    return {
      background: `rgb(${r} ${g} ${b})`,
      color: `rgb(${theme.primary.join(" ")})`,
    };
  }

  const [r, g, b] = theme.headerFill ?? [248, 250, 252];
  return {
    background: `rgb(${r} ${g} ${b})`,
    color: `rgb(${theme.primary.join(" ")})`,
  };
}

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
                  className="flex h-32 items-center justify-center text-sm font-medium"
                  style={swatchStyle(template.id)}
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
