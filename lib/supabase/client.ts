import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
