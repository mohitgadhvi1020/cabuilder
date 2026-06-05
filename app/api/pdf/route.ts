import { NextResponse, type NextRequest } from "next/server";
import puppeteer from "puppeteer";

// Puppeteer needs the Node.js runtime (not Edge) and must run per-request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORE_KEY = "cma-report-store-v3";

/**
 * Render the live /cma/preview page to a true vector PDF with headless Chromium.
 * The report data lives in the client's Zustand store (localStorage), so the
 * client sends that snapshot and we seed it into the page before it loads.
 */
export async function POST(req: NextRequest) {
  let storeState: string | null = null;
  let filename = "cma-report.pdf";
  try {
    const body = await req.json();
    storeState =
      typeof body.storeState === "string"
        ? body.storeState
        : body.storeState
          ? JSON.stringify(body.storeState)
          : null;
    if (body.filename) filename = String(body.filename);
  } catch {
    /* empty body is fine */
  }

  const { protocol, host } = new URL(req.url);
  const base = `${protocol}//${host}`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

    // Seed the persisted store BEFORE any app script runs.
    if (storeState) {
      await page.evaluateOnNewDocument(
        (key: string, value: string) => {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            /* ignore */
          }
        },
        STORE_KEY,
        storeState
      );
    }

    await page.goto(`${base}/cma/preview`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await page.waitForSelector(".a4-page", { timeout: 20000 });
    // Ensure web fonts and the cover image have settled.
    await page.evaluate(() => (document as Document).fonts?.ready);
    await new Promise((r) => setTimeout(r, 400));

    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const safeName = filename.replace(/[^a-zA-Z0-9 ._()-]/g, "_");
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
