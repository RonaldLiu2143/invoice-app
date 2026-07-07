import type { AppData } from "./types";
import { normalizeAppData } from "./normalize-data";
import { defaultAppData } from "./storage";
import { downloadBlob } from "./download";

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

export function downloadBackup(data: AppData): "downloaded" | "opened" {
  const json = exportAppData(data);
  const blob = new Blob([json], { type: "application/json" });
  const stamp = new Date().toISOString().split("T")[0];
  return downloadBlob(blob, `invoice-app-backup-${stamp}.json`);
}

export function parseBackupFile(raw: string): AppData {
  const parsed = JSON.parse(raw);
  const payload =
    parsed && typeof parsed === "object" && "data" in parsed
      ? (parsed as { data: unknown }).data
      : parsed;
  return normalizeAppData(payload, defaultAppData);
}
