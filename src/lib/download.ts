/** Download a blob as a file. On iOS, opens in a new tab (Save via share sheet). */
export function downloadBlob(
  blob: Blob,
  filename: string
): "downloaded" | "opened" {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!isIOS) {
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return "downloaded";
  }

  window.open(url, "_blank", "noopener,noreferrer");
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "opened";
}
