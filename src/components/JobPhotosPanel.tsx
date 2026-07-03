"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { JobPhoto } from "@/lib/types";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormFields";

const MAX_PHOTOS = 8;

export function JobPhotosPanel({
  photos,
  onChange,
  className = "mb-6",
}: {
  photos: JobPhoto[];
  onChange: (photos: JobPhoto[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const updatePhoto = (id: string, updates: Partial<JobPhoto>) => {
    onChange(
      photos.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos per invoice.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    try {
      const newPhotos: JobPhoto[] = [];
      for (const file of selected) {
        const dataUrl = await fileToCompressedDataUrl(file);
        newPhotos.push({
          id: uuidv4(),
          dataUrl,
          caption: "",
          serialNumber: "",
          showSerialNumber: true,
          createdAt: new Date().toISOString(),
        });
      }
      onChange([...photos, ...newPhotos]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add photo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader
        title="Job Photos"
        description="Attach job site photos. Optionally show a serial number on each photo."
        action={
          photos.length < MAX_PHOTOS ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Add Photo
            </Button>
          ) : undefined
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-slate-500">
          No photos yet. Add images from the job site to include them on the invoice and PDF.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-lg border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={photo.caption || "Job photo"}
                className="h-40 w-full object-cover"
              />
              <div className="space-y-3 p-3">
                <Input
                  label="Caption"
                  value={photo.caption}
                  onChange={(e) =>
                    updatePhoto(photo.id, { caption: e.target.value })
                  }
                  placeholder="e.g. Installed unit, before/after"
                />
                <Input
                  label="Serial number (optional)"
                  value={photo.serialNumber}
                  onChange={(e) =>
                    updatePhoto(photo.id, { serialNumber: e.target.value })
                  }
                  placeholder="S/N"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={photo.showSerialNumber}
                    onChange={(e) =>
                      updatePhoto(photo.id, {
                        showSerialNumber: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300"
                  />
                  Show serial number on invoice & PDF
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-2 text-red-600 hover:bg-red-50"
                  onClick={() => removePhoto(photo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
