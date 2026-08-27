import { createAdminClient } from "@/lib/supabase/admin";

export async function checkRateLimit(kind: string, keyHash: string | null, limit: number, windowMs: number) {
  if (!keyHash) return { allowed: true, count: 0 };
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await admin
    .from("security_rate_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("key_hash", keyHash)
    .gte("created_at", since);
  return { allowed: (count ?? 0) < limit, count: count ?? 0 };
}

export async function recordRateEvent(kind: string, keyHash: string | null) {
  if (!keyHash) return;
  const admin = createAdminClient();
  await admin.from("security_rate_events").insert({ kind, key_hash: keyHash });
}
