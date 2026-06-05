"use client";

/**
 * Export the report to PDF by rendering each `.a4-page` to its own canvas and
 * placing it as exactly one A4 page. This is deterministic — N pages on screen
 * produce N PDF pages — unlike html2pdf's auto-pagination, which slices the tall
 * combined DOM and emits a blank page after every page.
 */
export async function downloadReportPdf(filename: string = "cma-report.pdf"): Promise<void> {
  if (typeof window === "undefined") return;
  const root = document.getElementById("cma-report-print-root");
  if (!root) {
    window.print();
    return;
  }
  const pages = Array.from(root.querySelectorAll<HTMLElement>(".a4-page"));
  if (pages.length === 0) {
    window.print();
    return;
  }

  const [h2cMod, jspdfMod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvas = (h2cMod as any).default ?? h2cMod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JsPDF = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;

  // Strip on-screen shadows / rounded corners / gaps for clean capture.
  root.classList.add("pdf-exporting");
  try {
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const PAGE_W = 210;
    const PAGE_H = 297;

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: pages[i].scrollWidth,
        windowHeight: pages[i].scrollHeight,
      });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      // Scale to full A4 width; height follows the page's aspect (≈A4, ≤297mm).
      const imgH = Math.min(PAGE_H, (canvas.height * PAGE_W) / canvas.width);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, PAGE_W, imgH);
    }

    console.log(`[cma-pdf] generated ${pdf.internal.getNumberOfPages()} page(s) from ${pages.length} section(s)`);
    pdf.save(filename);
  } finally {
    root.classList.remove("pdf-exporting");
  }
}
