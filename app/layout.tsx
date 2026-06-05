import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "CMA Report Builder",
  description: "Build professional Credit Monitoring Arrangement reports with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates, causing a harmless
          server/client attribute mismatch. */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
