import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "./mockClient";

/** Demo mode: no real backend, auth + data are mocked in localStorage. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

// Derive the client type from a concrete call so it matches the (any-schema)
// type call sites were already written against — keeps their callback typing.
function realBrowserClient(url: string, key: string) {
  return createBrowserClient(url, key);
}
type BrowserClient = ReturnType<typeof realBrowserClient>;

export function createClient(): BrowserClient | null {
  if (isDemoMode()) {
    // The mock implements the narrow surface this app uses; present it as the
    // real client type so all call sites keep their existing typing.
    return createMockClient() as unknown as BrowserClient;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return realBrowserClient(url, key);
}

export function isSupabaseConfigured(): boolean {
  return (
    isDemoMode() ||
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
