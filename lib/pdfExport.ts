"use client";

/**
 * Export the report as a true vector PDF via the browser's native print engine
 * ("Save as PDF"). This produces crisp, selectable, searchable text and honours
 * all of our @media print CSS — unlike html2canvas, which rasterises the DOM
 * into a blurry image. The browser uses document.title as the default filename,
 * so we set it for the duration of the print and restore it afterwards.
 */
export async function downloadReportPdf(filename: string = "cma-report.pdf"): Promise<void> {
  if (typeof window === "undefined") return;

  const previousTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");

  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  // Safety net if afterprint never fires (some browsers).
  setTimeout(restore, 60000);

  window.print();
}
