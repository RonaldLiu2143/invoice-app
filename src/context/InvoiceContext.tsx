"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  AppData,
  CompanySettings,
  Customer,
  DocumentType,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Payment,
  Product,
} from "@/lib/types";
import {
  resolveInvoiceStatus,
  getBalanceDue,
  getAmountPaid,
  calculateInvoiceTotals,
  PAYMENT_TOLERANCE,
  todayISO,
  dueDateFromIssue,
} from "@/lib/calculations";
import { defaultAppData, loadAppData, saveAppData } from "@/lib/storage";
import { normalizeAppData } from "@/lib/normalize-data";

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
  duplicateInvoice: (id: string) => Invoice | undefined;
  convertQuoteToInvoice: (quoteId: string) => Invoice | undefined;
  importAppData: (data: AppData) => void;
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
const SAVE_DEBOUNCE_MS = 400;

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setData(loadAppData());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => saveAppData(data), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [data, isLoaded]);

  const customersById = useMemo(
    () => new Map(data.customers.map((customer) => [customer.id, customer])),
    [data.customers]
  );

  const productsById = useMemo(
    () => new Map(data.products.map((product) => [product.id, product])),
    [data.products]
  );

  const invoicesById = useMemo(
    () => new Map(data.invoices.map((invoice) => [invoice.id, invoice])),
    [data.invoices]
  );

  const addCustomer = useCallback(
    (customer: Omit<Customer, "id" | "createdAt">) => {
      const newCustomer: Customer = {
        ...customer,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        customers: [...prev.customers, newCustomer],
      }));
      return newCustomer;
    },
    []
  );

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((customer) =>
        customer.id === id ? { ...customer, ...updates } : customer
      ),
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((customer) => customer.id !== id),
    }));
  }, []);

  const addProduct = useCallback(
    (product: Omit<Product, "id" | "createdAt">) => {
      const newProduct: Product = {
        ...product,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        products: [...prev.products, newProduct],
      }));
      return newProduct;
    },
    []
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === id ? { ...product, ...updates } : product
      ),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
  }, []);

  const addInvoice = useCallback(
    (
      invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      const prev = dataRef.current;
      const created: Invoice = {
        ...invoice,
        documentType: invoice.documentType ?? "invoice",
        payments: invoice.payments ?? [],
        id: uuidv4(),
        invoiceNumber: String(prev.nextInvoiceNumber),
        createdAt: now,
        updatedAt: now,
      };
      setData({
        ...prev,
        invoices: [...prev.invoices, created],
        nextInvoiceNumber: prev.nextInvoiceNumber + 1,
      });
      return created;
    },
    []
  );

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setData((prev) => {
      const existing = prev.invoices.find((invoice) => invoice.id === id);
      if (!existing) return prev;

      const merged: Invoice = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      const total = calculateInvoiceTotals(merged).total;
      const paid = getAmountPaid(merged);
      if (paid > total + PAYMENT_TOLERANCE) return prev;

      return {
        ...prev,
        invoices: prev.invoices.map((invoice) =>
          invoice.id === id ? merged : invoice
        ),
      };
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((invoice) => invoice.id !== id),
    }));
  }, []);

  const duplicateInvoice = useCallback((id: string): Invoice | undefined => {
    const source = dataRef.current.invoices.find((invoice) => invoice.id === id);
    if (!source) return undefined;

    const issueDate = todayISO();
    const duplicated = addInvoice({
      documentType: source.documentType ?? "invoice",
      customerId: source.customerId,
      lineItems: source.lineItems.map((item) => ({
        ...item,
        id: uuidv4(),
      })),
      taxRate: source.taxRate,
      discountType: source.discountType,
      discountValue: source.discountValue,
      status: "unpaid",
      issueDate,
      dueDate: dueDateFromIssue(issueDate),
      jobReference: source.jobReference,
      notes: source.notes,
      terms: source.terms,
      templateId: source.templateId,
      payments: [],
      jobPhotos: (source.jobPhotos ?? []).map((photo) => ({
        ...photo,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      })),
    });
    return duplicated;
  }, [addInvoice]);

  const convertQuoteToInvoice = useCallback(
    (quoteId: string): Invoice | undefined => {
      const prev = dataRef.current;
      const quote = prev.invoices.find(
        (invoice) => invoice.id === quoteId && invoice.documentType === "quote"
      );
      if (!quote) return undefined;

      const now = new Date().toISOString();
      const issueDate = todayISO();
      const converted: Invoice = {
        ...quote,
        documentType: "invoice",
        invoiceNumber: String(prev.nextInvoiceNumber),
        issueDate,
        dueDate: dueDateFromIssue(issueDate),
        status: "unpaid",
        payments: [],
        updatedAt: now,
      };

      setData({
        ...prev,
        invoices: prev.invoices.map((invoice) =>
          invoice.id === quoteId ? converted : invoice
        ),
        nextInvoiceNumber: prev.nextInvoiceNumber + 1,
      });
      return converted;
    },
    []
  );

  const importAppData = useCallback((imported: AppData) => {
    setData(normalizeAppData(imported, defaultAppData));
  }, []);

  const addPayment = useCallback(
    (invoiceId: string, amount: number, date: string, note = "") => {
      setData((prev) => {
        const invoice = prev.invoices.find((inv) => inv.id === invoiceId);
        if (!invoice) return prev;
        const balance = getBalanceDue(invoice);
        if (amount <= 0 || amount > balance + PAYMENT_TOLERANCE) return prev;

        const payment: Payment = {
          id: uuidv4(),
          amount,
          date,
          note,
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
    []
  );

  const removePayment = useCallback((invoiceId: string, paymentId: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              payments: (invoice.payments ?? []).filter(
                (payment) => payment.id !== paymentId
              ),
              updatedAt: new Date().toISOString(),
            }
          : invoice
      ),
    }));
  }, []);

  const payInvoiceInFull = useCallback((invoiceId: string) => {
    setData((prev) => {
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
  }, []);

  const updateSettings = useCallback((settings: Partial<CompanySettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const getCustomer = useCallback(
    (id: string) => customersById.get(id),
    [customersById]
  );

  const getProduct = useCallback(
    (id: string) => productsById.get(id),
    [productsById]
  );

  const getInvoice = useCallback(
    (id: string) => invoicesById.get(id),
    [invoicesById]
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
        duplicateInvoice,
        convertQuoteToInvoice,
        importAppData,
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
    priceMode: "unit",
  };
}
