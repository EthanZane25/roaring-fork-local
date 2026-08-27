import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp, hashSignal } from "@/lib/vote-security";
import { checkRateLimit, recordRateEvent } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv() || !hasSupabaseServiceRole()) return NextResponse.json({ error: "Account creation is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { email?: string; password?: string; displayName?: string; captchaToken?: string } | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";
  const displayName = body?.displayName?.trim() || "";
  if (!email || password.length < 8 || !displayName) return NextResponse.json({ error: "Name, email, and an 8+ character password are required." }, { status: 400 });

  const ip = getClientIp(request.headers);
  const ipHash = hashSignal("account-create-ip", ip);
  const rate = await checkRateLimit("account_create_ip", ipHash, 20, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many account creation attempts from this network. Try again later." }, { status: 429 });
  await recordRateEvent("account_create_ip", ipHash);

  const turnstile = await verifyTurnstile(body?.captchaToken, "signup", ip);
  if (!turnstile.ok || (process.env.NODE_ENV === "production" && turnstile.skipped)) {
    return NextResponse.json({ error: "Security verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, needsEmailVerification: !data.user?.email_confirmed_at });
}
