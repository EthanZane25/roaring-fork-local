import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventInput = {
  eventType: string;
  userId?: string | null;
  listingId?: string | null;
  deviceHash?: string | null;
  ipHash?: string | null;
  networkHash?: string | null;
  userAgentHash?: string | null;
  decision?: string | null;
  details?: Record<string, unknown>;
};

export async function recordSecurityEvent(input: SecurityEventInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("security_events").insert({
    event_type: input.eventType,
    user_id: input.userId ?? null,
    listing_id: input.listingId ?? null,
    device_hash: input.deviceHash ?? null,
    ip_hash: input.ipHash ?? null,
    network_hash: input.networkHash ?? null,
    user_agent_hash: input.userAgentHash ?? null,
    decision: input.decision ?? null,
    details: input.details ?? {}
  });

  if (error) {
    console.error("Unable to record security event:", error.message);
  }
}
