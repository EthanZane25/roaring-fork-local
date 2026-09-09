import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { checkPhoneVerification } from "@/lib/twilio-verify";
import { DEVICE_COOKIE_NAME } from "@/lib/device-security";
import { hashSignal } from "@/lib/vote-security";

function normalizeUsPhone(value: string) {
  const trimmed = value.trim();
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole() || (process.env.NODE_ENV === "production" && !process.env.VOTE_FRAUD_SECRET)) {
    return NextResponse.json({ error: "Phone verification storage is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    phone?: string;
    code?: string;
    purpose?: "vote" | "create_listing";
  } | null;

  const purpose = body?.purpose === "create_listing" ? "create_listing" : "vote";
  let phone = body?.phone ? normalizeUsPhone(body.phone) : null;
  const code = body?.code?.replace(/\D/g, "").slice(0, 10) || "";

  if (!phone && purpose === "create_listing") {
    const { data: identity } = await supabase
      .from("users")
      .select("phone_e164,phone_verified_at")
      .eq("id", user.id)
      .maybeSingle();

    if (identity?.phone_verified_at && identity.phone_e164) {
      phone = identity.phone_e164;
    }
  }

  if (!phone || code.length < 4) {
    return NextResponse.json({ error: "Enter the phone number and verification code." }, { status: 400 });
  }

  const devPhoneBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_PHONE_BYPASS === "true";

  if (devPhoneBypass) {
    if (code !== "000000") {
      return NextResponse.json(
        { error: "Development code is 000000." },
        { status: 400 }
      );
    }
  } else {
    const result = await checkPhoneVerification(phone, code);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "The code was not approved." },
        { status: 400 }
      );
    }
  }

  const phoneHash = hashSignal("verified-phone", phone);
  const admin = createAdminClient();

  const [{ data: existingIdentity }, { data: existingPhone }] = await Promise.all([
    admin.from("voter_identities").select("user_id").eq("phone_hash", phoneHash).neq("user_id", user.id).maybeSingle(),
    admin.from("users").select("id").eq("phone_e164", phone).neq("id", user.id).maybeSingle()
  ]);

  if (existingIdentity || existingPhone) {
    return NextResponse.json({ error: "That mobile number is already verified on another account." }, { status: 409 });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const { error: identityError } = await admin.from("voter_identities").upsert({
    user_id: user.id,
    phone_hash: phoneHash,
    phone_last4: phone.slice(-4),
    verified_at: nowIso
  }, { onConflict: "user_id" });

  if (identityError) {
    return NextResponse.json({
      error: identityError.code === "23505"
        ? "That mobile number is already verified on another account."
        : "Unable to save phone verification."
    }, { status: identityError.code === "23505" ? 409 : 500 });
  }

  const { error: userError } = await admin.from("users").upsert({
    id: user.id,
    email: user.email.toLowerCase(),
    email_verified_at: user.email_confirmed_at || null,
    phone_e164: phone,
    phone_verified_at: nowIso,
    updated_at: nowIso
  }, { onConflict: "id" });

  if (userError) {
    return NextResponse.json({
      error: userError.code === "23505"
        ? "That mobile number is already verified on another account."
        : "Unable to finish phone verification."
    }, { status: userError.code === "23505" ? 409 : 500 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ phone_verified: true, updated_at: nowIso })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Unable to finish phone verification." }, { status: 500 });
  }

  if (purpose === "create_listing") {
    const deviceToken = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
    const deviceHash = hashSignal("device-cookie", deviceToken);

    if (!deviceHash) {
      return NextResponse.json({ error: "Refresh the page before verifying your phone." }, { status: 400 });
    }

    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

    await admin
      .from("security_stepups")
      .delete()
      .eq("user_id", user.id)
      .eq("purpose", "create_listing")
      .eq("device_hash", deviceHash)
      .is("used_at", null);

    const { error: stepupError } = await admin.from("security_stepups").insert({
      user_id: user.id,
      purpose: "create_listing",
      device_hash: deviceHash,
      verified_at: nowIso,
      expires_at: expiresAt
    });

    if (stepupError) {
      return NextResponse.json({ error: "Phone verified, but the listing authorization could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, last4: phone.slice(-4), stepUpExpiresAt: expiresAt });
  }

  return NextResponse.json({ ok: true, last4: phone.slice(-4) });
}
