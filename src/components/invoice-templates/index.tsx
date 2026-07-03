import type { ComponentType } from "react";
import type { InvoiceTemplateId } from "@/lib/types";
import type { InvoiceTemplateProps } from "./types";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { BoldTemplate } from "./BoldTemplate";
import { ElegantTemplate } from "./ElegantTemplate";
import { MinimalTemplate } from "./MinimalTemplate";

const TEMPLATE_MAP: Record<
  InvoiceTemplateId,
  ComponentType<InvoiceTemplateProps>
> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  bold: BoldTemplate,
  elegant: ElegantTemplate,
  minimal: MinimalTemplate,
};

export function InvoicePreview({
  templateId,
  ...props
}: InvoiceTemplateProps & { templateId: InvoiceTemplateId }) {
  const Template = TEMPLATE_MAP[templateId] ?? ClassicTemplate;
  return (
    <div className="overflow-x-auto shadow-sm">
      <Template {...props} />
    </div>
  );
}
