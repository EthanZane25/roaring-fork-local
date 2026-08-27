import { createHmac, randomUUID } from "node:crypto";

export type VoteClientSignals = {
  timezone?: string;
  language?: string;
  platform?: string;
  screen?: string;
};

function secret() {
  return (
    process.env.VOTE_FRAUD_SECRET ||
    process.env.TURNSTILE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "local-development-only"
  );
}

export function hashSignal(label: string, value?: string | null) {
  if (!value) return null;
  return createHmac("sha256", secret())
    .update(`${label}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

export function getClientIp(headers: Headers) {
  const direct = headers.get("cf-connecting-ip") || headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}

export function getNetworkPrefix(ip?: string | null) {
  if (!ip) return null;
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 4).join(":")}::/64`;
  }
  return ip;
}

export function fingerprintValue(userAgent: string, signals?: VoteClientSignals | null) {
  return [
    userAgent,
    signals?.timezone || "",
    signals?.language || "",
    signals?.platform || "",
    signals?.screen || ""
  ].join("|");
}

export function newDeviceToken() {
  return randomUUID();
}
