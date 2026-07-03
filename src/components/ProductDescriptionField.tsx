"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

const inputClass =
  "h-[38px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function ProductDescriptionField({
  products,
  value,
  productId,
  onValueChange,
  onProductSelect,
  placeholder = "Type description or pick product",
}: {
  products: Product[];
  value: string;
  productId?: string;
  onValueChange: (description: string, linkedProductId?: string) => void;
  onProductSelect: (product: Product) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return products.slice(0, 8);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.serialNumber ?? "").toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [products, value]);

  const linkedProduct = products.find((product) => product.id === productId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectProduct = (product: Product) => {
    onProductSelect(product);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          const match = products.find(
            (product) =>
              product.name.trim().toLowerCase() === next.trim().toLowerCase()
          );
          onValueChange(next, match?.id);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClass}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full min-w-[12rem] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectProduct(product)}
              >
                <span className="font-medium text-slate-900">{product.name}</span>
                <span className="ml-2 text-slate-500">
                  {formatCurrency(product.price)}
                </span>
                {product.serialNumber && (
                  <span className="ml-2 text-xs text-slate-400">
                    S/N {product.serialNumber}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {linkedProduct && (
        <p className="sr-only">Linked to product catalog</p>
      )}
    </div>
  );
}

export { inputClass as lineItemInputClass };
