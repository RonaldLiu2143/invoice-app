"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  AppData,
  CompanySettings,
  Customer,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Payment,
  Product,
} from "@/lib/types";
import { resolveInvoiceStatus, getBalanceDue } from "@/lib/calculations";
import { defaultAppData, loadAppData, saveAppData } from "@/lib/storage";

interface InvoiceContextValue {
  data: AppData;
  isLoaded: boolean;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addInvoice: (
    invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">
  ) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addPayment: (
    invoiceId: string,
    amount: number,
    date: string,
    note?: string
  ) => void;
  removePayment: (invoiceId: string, paymentId: string) => void;
  payInvoiceInFull: (invoiceId: string) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;
  getCustomer: (id: string) => Customer | undefined;
  getProduct: (id: string) => Product | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  getEffectiveStatus: (invoice: Invoice) => InvoiceStatus;
}

const InvoiceContext = createContext<InvoiceContextValue | null>(null);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setData(loadAppData());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveAppData(data);
  }, [data, isLoaded]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData(updater);
  }, []);

  const addCustomer = useCallback(
    (customer: Omit<Customer, "id" | "createdAt">) => {
      const newCustomer: Customer = {
        ...customer,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        customers: [...prev.customers, newCustomer],
      }));
      return newCustomer;
    },
    [update]
  );

  const updateCustomer = useCallback(
    (id: string, updates: Partial<Customer>) => {
      update((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    [update]
  );

  const deleteCustomer = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
      }));
    },
    [update]
  );

  const addProduct = useCallback(
    (product: Omit<Product, "id" | "createdAt">) => {
      const newProduct: Product = {
        ...product,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        products: [...prev.products, newProduct],
      }));
      return newProduct;
    },
    [update]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      update((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    },
    [update]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
    },
    [update]
  );

  const addInvoice = useCallback(
    (
      invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      let newInvoice!: Invoice;
      update((prev) => {
        newInvoice = {
          ...invoice,
          payments: invoice.payments ?? [],
          id: uuidv4(),
          invoiceNumber: String(prev.nextInvoiceNumber),
          createdAt: now,
          updatedAt: now,
        };
        return {
          ...prev,
          invoices: [...prev.invoices, newInvoice],
          nextInvoiceNumber: prev.nextInvoiceNumber + 1,
        };
      });
      return newInvoice;
    },
    [update]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      update((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === id
            ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
            : inv
        ),
      }));
    },
    [update]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        invoices: prev.invoices.filter((inv) => inv.id !== id),
      }));
    },
    [update]
  );

  const addPayment = useCallback(
    (
      invoiceId: string,
      amount: number,
      date: string,
      note = ""
    ) => {
      const payment: Payment = {
        id: uuidv4(),
        amount,
        date,
        note,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                payments: [...(inv.payments ?? []), payment],
                updatedAt: new Date().toISOString(),
              }
            : inv
        ),
      }));
    },
    [update]
  );

  const removePayment = useCallback(
    (invoiceId: string, paymentId: string) => {
      update((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                payments: (inv.payments ?? []).filter((p) => p.id !== paymentId),
                updatedAt: new Date().toISOString(),
              }
            : inv
        ),
      }));
    },
    [update]
  );

  const payInvoiceInFull = useCallback(
    (invoiceId: string) => {
      update((prev) => {
        const invoice = prev.invoices.find((inv) => inv.id === invoiceId);
        if (!invoice) return prev;
        const balance = getBalanceDue(invoice);
        if (balance <= 0) return prev;
        const payment: Payment = {
          id: uuidv4(),
          amount: balance,
          date: new Date().toISOString().split("T")[0],
          note: "Paid in full",
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          invoices: prev.invoices.map((inv) =>
            inv.id === invoiceId
              ? {
                  ...inv,
                  payments: [...(inv.payments ?? []), payment],
                  updatedAt: new Date().toISOString(),
                }
              : inv
          ),
        };
      });
    },
    [update]
  );

  const updateSettings = useCallback(
    (settings: Partial<CompanySettings>) => {
      update((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
    },
    [update]
  );

  const getCustomer = useCallback(
    (id: string) => data.customers.find((c) => c.id === id),
    [data.customers]
  );

  const getProduct = useCallback(
    (id: string) => data.products.find((p) => p.id === id),
    [data.products]
  );

  const getInvoice = useCallback(
    (id: string) => data.invoices.find((inv) => inv.id === id),
    [data.invoices]
  );

  const getEffectiveStatus = useCallback(
    (invoice: Invoice) => resolveInvoiceStatus(invoice),
    []
  );

  return (
    <InvoiceContext.Provider
      value={{
        data,
        isLoaded,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addPayment,
        removePayment,
        payInvoiceInFull,
        updateSettings,
        getCustomer,
        getProduct,
        getInvoice,
        getEffectiveStatus,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error("useInvoice must be used within InvoiceProvider");
  return ctx;
}

export function createEmptyLineItem(): InvoiceLineItem {
  return {
    id: uuidv4(),
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}
