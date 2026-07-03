import type { InvoiceTemplateProps } from "./types";
import { InvoiceDocumentLayout } from "./InvoiceDocumentLayout";

export function BoldTemplate(props: InvoiceTemplateProps) {
  return <InvoiceDocumentLayout {...props} templateId="bold" />;
}
