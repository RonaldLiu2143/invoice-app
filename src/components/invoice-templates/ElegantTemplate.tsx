import type { InvoiceTemplateProps } from "./types";
import { InvoiceDocumentLayout } from "./InvoiceDocumentLayout";

export function ElegantTemplate(props: InvoiceTemplateProps) {
  return <InvoiceDocumentLayout {...props} templateId="elegant" />;
}
