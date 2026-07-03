import type { InvoiceTemplateProps } from "./types";
import { InvoiceDocumentLayout } from "./InvoiceDocumentLayout";

export function ClassicTemplate(props: InvoiceTemplateProps) {
  return <InvoiceDocumentLayout {...props} templateId="classic" />;
}
