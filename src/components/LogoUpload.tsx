"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { Button } from "@/components/Button";

export function LogoUpload({
  logoDataUrl,
  onChange,
}: {
  logoDataUrl?: string;
  onChange: (logoDataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleFile = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(files[0]);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload logo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">Company Logo</p>
      <p className="mb-3 text-xs text-slate-500">
        Shown on invoices, quotes, and PDFs. Square or wide logos work best.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      {logoDataUrl ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              alt="Company logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-red-600"
              onClick={() => onChange(undefined)}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          Upload Logo
        </Button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
