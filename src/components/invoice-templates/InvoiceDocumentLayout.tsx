import type { InvoiceTemplateId } from "@/lib/types";
import type { InvoiceTemplateProps } from "./types";
import {
  CompanyLogo,
  documentTitle,
  LineItemsTable,
  TotalsBlock,
  JobPhotosGrid,
} from "./shared";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
import {
  formatCurrency,
  formatDate,
  documentLabel,
  isQuote,
} from "@/lib/calculations";

export interface DocumentLayoutTheme {
  accentBar: string;
  accentText: string;
  headBg: string;
  headText: string;
  border: string;
  panelBg: string;
  totalAccent: string;
}

const LAYOUT_THEMES: Record<InvoiceTemplateId, DocumentLayoutTheme> = {
  classic: {
    accentBar: "bg-blue-900",
    accentText: "text-blue-900",
    headBg: "bg-blue-900 text-white",
    headText: "text-white",
    border: "border-slate-300",
    panelBg: "bg-slate-50",
    totalAccent: "text-blue-900",
  },
  modern: {
    accentBar: "bg-indigo-600",
    accentText: "text-indigo-700",
    headBg: "bg-indigo-600 text-white",
    headText: "text-white",
    border: "border-indigo-200",
    panelBg: "bg-indigo-50/50",
    totalAccent: "text-indigo-700",
  },
  bold: {
    accentBar: "bg-slate-900",
    accentText: "text-slate-900",
    headBg: "bg-slate-900 text-white",
    headText: "text-white",
    border: "border-slate-300",
    panelBg: "bg-slate-50",
    totalAccent: "text-slate-900",
  },
  elegant: {
    accentBar: "bg-amber-800",
    accentText: "text-amber-900",
    headBg: "bg-amber-800 text-white",
    headText: "text-white",
    border: "border-amber-200",
    panelBg: "bg-amber-50/60",
    totalAccent: "text-amber-900",
  },
  minimal: {
    accentBar: "bg-neutral-900",
    accentText: "text-neutral-900",
    headBg: "bg-neutral-800 text-white",
    headText: "text-white",
    border: "border-neutral-300",
    panelBg: "bg-neutral-50",
    totalAccent: "text-neutral-900",
  },
};

function partyText(values: {
  name: string;
  email: string;
  phone: string;
  address: string;
}): string[] {
  const lines = [values.name.trim() || "—"];
  if (values.email.trim()) lines.push(`Email: ${values.email.trim()}`);
  if (values.phone.trim()) lines.push(`Phone: ${values.phone.trim()}`);
  if (values.address.trim()) lines.push(values.address.trim());
  return lines;
}

function DetailsColumn({
  invoice,
  theme,
}: {
  invoice: InvoiceTemplateProps["invoice"];
  theme: DocumentLayoutTheme;
}) {
  const notes = invoice.notes.trim();
  const terms = invoice.terms?.trim();
  const payments = isQuote(invoice)
    ? []
    : [...(invoice.payments ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

  const sections: { title: string; body: string }[] = [];
  if (notes) sections.push({ title: "Notes", body: notes });
  if (terms) sections.push({ title: "Terms & Conditions", body: terms });
  if (payments.length > 0) {
    sections.push({
      title: "Payment History",
      body: payments
        .map(
          (p) =>
            `${formatDate(p.date)} — ${formatCurrency(p.amount)}${p.note ? ` (${p.note})` : ""}`
        )
        .join("\n"),
    });
  }

  if (sections.length === 0) {
    return (
      <div
        className={`flex min-h-[120px] items-center justify-center rounded-lg border ${theme.border} ${theme.panelBg} p-4 text-sm italic text-slate-500`}
      >
        Thank you for your business.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div
          key={section.title}
          className={`rounded-lg border ${theme.border} ${theme.panelBg} p-4 text-sm`}
        >
          <p className="mb-2 font-semibold text-slate-800">{section.title}</p>
          <p className="whitespace-pre-wrap text-slate-600">{section.body}</p>
        </div>
      ))}
    </div>
  );
}

export function InvoiceDocumentLayout({
  templateId,
  invoice,
  customer,
  settings,
  status,
  totals,
  compact,
}: InvoiceTemplateProps & { templateId: InvoiceTemplateId }) {
  const theme = LAYOUT_THEMES[templateId];
  const pad = compact ? "px-4 py-3" : "px-5 py-4";
  const quote = isQuote(invoice);
  const label = documentLabel(invoice);

  const contact = [settings.email, settings.phone]
    .filter((v) => v?.trim())
    .join(" · ");

  return (
    <div
      className={`overflow-hidden rounded-lg border ${theme.border} bg-white ${compact ? "text-xs" : "text-sm"}`}
    >
      <div className={`h-1.5 ${theme.accentBar}`} />

      {/* Header — matches PDF */}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${pad}`}>
        <div className="flex items-center gap-4">
          <CompanyLogo settings={settings} className="h-11 max-w-[140px] object-contain" />
          <div>
            <h2
              className={`font-bold uppercase tracking-wide ${theme.accentText} ${compact ? "text-xl" : "text-2xl"}`}
            >
              {documentTitle(invoice)}
            </h2>
            <p className="text-slate-500">#{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-bold text-slate-900">{settings.name}</p>
          <div className="mt-2 flex sm:justify-end">
            <DocumentStatusBadge invoice={invoice} status={status} size="lg" />
          </div>
        </div>
      </div>

      {/* Party table — matches PDF */}
      <div className={pad}>
        <div className={`overflow-hidden rounded-lg border ${theme.border}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={theme.headBg}>
                <th className={`border border-inherit px-4 py-2.5 text-left text-xs font-bold uppercase ${theme.headText}`}>
                  From (Company)
                </th>
                <th className={`border border-inherit px-4 py-2.5 text-left text-xs font-bold uppercase ${theme.headText}`}>
                  Bill To (Customer)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={theme.panelBg}>
                <td className="border border-slate-200 px-4 py-3 align-top whitespace-pre-line text-slate-700">
                  {partyText(settings).join("\n")}
                </td>
                <td className="border border-slate-200 px-4 py-3 align-top whitespace-pre-line text-slate-700">
                  {partyText(customer).join("\n")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta row — matches PDF */}
      <div className={`${pad} pt-0`}>
        <div className={`overflow-hidden rounded-lg border ${theme.border}`}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="bg-white font-semibold text-slate-800">
                <td className="border border-slate-200 px-4 py-2.5">
                  {label} #: {invoice.invoiceNumber}
                </td>
                <td className="border border-slate-200 px-4 py-2.5">
                  Issued: {formatDate(invoice.issueDate)}
                </td>
                <td className="border border-slate-200 px-4 py-2.5">
                  {quote ? "Valid until" : "Due"}: {formatDate(invoice.dueDate)}
                </td>
              </tr>
              {invoice.jobReference?.trim() && (
                <tr className={theme.panelBg}>
                  <td
                    className="border border-slate-200 px-4 py-2 text-slate-700"
                    colSpan={3}
                  >
                    Job / PO: {invoice.jobReference.trim()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line items */}
      <div className={pad}>
        <LineItemsTable
          invoice={invoice}
          compact={compact}
          headClass={theme.headBg}
          rowClass="border-b border-slate-100"
          borderClass={`border ${theme.border}`}
        />
      </div>

      {/* Bottom: details left, totals right — matches PDF */}
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[1.35fr_1fr] ${pad} pt-0`}>
        <DetailsColumn invoice={invoice} theme={theme} />
        <TotalsBlock
          invoice={invoice}
          totals={totals}
          compact={compact}
          totalClass={`${theme.totalAccent} text-base`}
          boxClass={`rounded-lg border ${theme.border} ${theme.panelBg} p-4 w-full`}
        />
      </div>

      {/* Job photos — up to 3 across like PDF */}
      {invoice.jobPhotos && invoice.jobPhotos.length > 0 && (
        <div className={pad}>
          <JobPhotosGrid photos={invoice.jobPhotos} maxPhotos={3} compact />
        </div>
      )}

      {/* Footer contact */}
      {contact && (
        <div className={`border-t ${theme.border} px-5 py-3 text-center text-xs text-slate-500`}>
          {contact}
        </div>
      )}
    </div>
  );
}
