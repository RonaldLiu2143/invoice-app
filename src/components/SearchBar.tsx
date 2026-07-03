import { Search } from "lucide-react";
import { Input } from "@/components/FormFields";

export function SearchBar({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="!pl-9"
      />
    </div>
  );
}

export function SearchResultsHint({
  query,
  resultCount,
  totalCount,
}: {
  query: string;
  resultCount: number;
  totalCount: number;
}) {
  if (!query.trim()) return null;
  return (
    <p className="mt-2 text-sm text-slate-500">
      {resultCount === 0
        ? "No matches found"
        : `Showing ${resultCount} of ${totalCount} result${totalCount === 1 ? "" : "s"}`}
    </p>
  );
}
