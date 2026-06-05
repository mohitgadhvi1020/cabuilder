"use client";

const STORE_KEY = "cma-report-store-v3";

/**
 * Download the report as a true vector PDF.
 *
 * Primary path: POST the current store snapshot to /api/pdf, where headless
 * Chromium (Puppeteer) renders the live /cma/preview page and returns a crisp,
 * selectable, correctly-paginated PDF in one click — no print dialog.
 *
 * Fallback: if the server route is unavailable (e.g. a static/serverless host
 * without Chromium), use the browser's native print engine ("Save as PDF"),
 * which also produces vector output but needs the user to confirm the dialog.
 */
export async function downloadReportPdf(filename: string = "cma-report.pdf"): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const storeState = localStorage.getItem(STORE_KEY);
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeState, filename }),
    });
    if (!res.ok) throw new Error(`PDF service responded ${res.status}`);

    const blob = await res.blob();
    if (blob.type !== "application/pdf") throw new Error("Unexpected response type");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("[cma-pdf] server export unavailable, falling back to print:", err);
    fallbackToPrint(filename);
  }
}

function fallbackToPrint(filename: string): void {
  const previousTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  setTimeout(restore, 60000);
  window.print();
}
