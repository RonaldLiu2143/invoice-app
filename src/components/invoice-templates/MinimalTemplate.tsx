import type { InvoiceTemplateProps } from "./types";
import { InvoiceDocumentLayout } from "./InvoiceDocumentLayout";

export function MinimalTemplate(props: InvoiceTemplateProps) {
  return <InvoiceDocumentLayout {...props} templateId="minimal" />;
}
