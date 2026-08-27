import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { checkPhoneVerification } from "@/lib/twilio-verify";
import { hashSignal } from "@/lib/vote-security";

function normalizeUsPhone(value: string) {
  const trimmed = value.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRole() || (process.env.NODE_ENV === "production" && !process.env.VOTE_FRAUD_SECRET)) return NextResponse.json({ error: "Phone verification storage is not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null) as { phone?: string; code?: string } | null;
  const phone = body?.phone ? normalizeUsPhone(body.phone) : null;
  const code = body?.code?.replace(/\D/g, "").slice(0, 10) || "";
  if (!phone || code.length < 4) return NextResponse.json({ error: "Enter the phone number and verification code." }, { status: 400 });
  const result = await checkPhoneVerification(phone, code);
  if (!result.ok) return NextResponse.json({ error: result.error || "The code was not approved." }, { status: 400 });

  const phoneHash = hashSignal("verified-phone", phone);
  const admin = createAdminClient();
  const [{ data: existingIdentity }, { data: existingPhone }] = await Promise.all([
    admin.from("voter_identities").select("user_id").eq("phone_hash", phoneHash).neq("user_id", user.id).maybeSingle(),
    admin.from("users").select("id").eq("phone_e164", phone).neq("id", user.id).maybeSingle()
  ]);
  if (existingIdentity || existingPhone) return NextResponse.json({ error: "That mobile number is already verified on another account." }, { status: 409 });

  const { error: identityError } = await admin.from("voter_identities").upsert({ user_id: user.id, phone_hash: phoneHash, phone_last4: phone.slice(-4), verified_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (identityError) return NextResponse.json({ error: identityError.code === "23505" ? "That mobile number is already verified on another account." : "Unable to save phone verification." }, { status: identityError.code === "23505" ? 409 : 500 });

  const now = new Date().toISOString();
  const { error: userError } = await admin.from("users").upsert({
    id: user.id,
    email: user.email.toLowerCase(),
    email_verified_at: user.email_confirmed_at || null,
    phone_e164: phone,
    phone_verified_at: now,
    updated_at: now
  }, { onConflict: "id" });
  if (userError) return NextResponse.json({ error: userError.code === "23505" ? "That mobile number is already verified on another account." : "Unable to finish phone verification." }, { status: userError.code === "23505" ? 409 : 500 });

  const { error } = await admin.from("profiles").update({ phone_verified: true, updated_at: now }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Unable to finish phone verification." }, { status: 500 });
  return NextResponse.json({ ok: true, last4: phone.slice(-4) });
}
