import type { AppData } from "./types";
import { normalizeAppData } from "./normalize-data";
import { defaultAppData } from "./storage";

const BACKUP_VERSION = 1;

export function exportAppData(data: AppData): string {
  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

export function downloadBackup(data: AppData): void {
  const json = exportAppData(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().split("T")[0];
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoice-app-backup-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(raw: string): AppData {
  const parsed = JSON.parse(raw);
  const payload =
    parsed && typeof parsed === "object" && "data" in parsed
      ? (parsed as { data: unknown }).data
      : parsed;
  return normalizeAppData(payload, defaultAppData);
}
