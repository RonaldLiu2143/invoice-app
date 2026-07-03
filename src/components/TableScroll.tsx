import type { ReactNode } from "react";

export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="-mx-px overflow-x-auto">{children}</div>;
}
