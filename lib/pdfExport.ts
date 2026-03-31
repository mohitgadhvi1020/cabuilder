"use client";

export async function downloadReportPdf(filename: string = "cma-report.pdf"): Promise<void> {
  if (typeof window === "undefined") return;
  const el = document.getElementById("cma-report-print-root");
  if (!el) {
    window.print();
    return;
  }

  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        removeContainer: true,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], before: ".a4-page", avoid: ["tr", "td"] },
    })
    .from(el)
    .save();
}
