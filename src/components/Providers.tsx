"use client";

import { InvoiceProvider } from "@/context/InvoiceContext";
import { AppShell } from "@/components/AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InvoiceProvider>
      <AppShell>{children}</AppShell>
    </InvoiceProvider>
  );
}
