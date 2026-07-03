import type { InvoiceTemplateProps } from "./types";
import { InvoiceDocumentLayout } from "./InvoiceDocumentLayout";

export function ModernTemplate(props: InvoiceTemplateProps) {
  return <InvoiceDocumentLayout {...props} templateId="modern" />;
}
