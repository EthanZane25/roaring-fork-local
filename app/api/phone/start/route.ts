import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { startPhoneVerification } from "@/lib/twilio-verify";
import { getClientIp, hashSignal } from "@/lib/vote-security";
import { checkRateLimit, recordRateEvent } from "@/lib/rate-limit";

function normalizeUsPhone(value: string) {
  const trimmed = value.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole()) return NextResponse.json({ error: "Phone verification is not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null) as { phone?: string; turnstileToken?: string } | null;
  const phone = body?.phone ? normalizeUsPhone(body.phone) : null;
  if (!phone) return NextResponse.json({ error: "Enter a valid mobile number including area code." }, { status: 400 });

  const ip = getClientIp(request.headers);
  const phoneHash = hashSignal("sms-rate-phone", phone);
  const ipHash = hashSignal("sms-rate-ip", ip);
  const [phoneRate, ipRate] = await Promise.all([
    checkRateLimit("sms_phone", phoneHash, 5, 60 * 60 * 1000),
    checkRateLimit("sms_ip", ipHash, 15, 60 * 60 * 1000)
  ]);
  if (!phoneRate.allowed || !ipRate.allowed) return NextResponse.json({ error: "Too many verification codes were requested. Try again later." }, { status: 429 });

  const turnstile = await verifyTurnstile(body?.turnstileToken, "phone_verify", ip);
  if (!turnstile.ok || (process.env.NODE_ENV === "production" && turnstile.skipped)) return NextResponse.json({ error: "Security verification failed." }, { status: 400 });

  await Promise.all([recordRateEvent("sms_phone", phoneHash), recordRateEvent("sms_ip", ipHash)]);
  const result = await startPhoneVerification(phone);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, phone });
}
