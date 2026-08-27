import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  fingerprintValue,
  getClientIp,
  hashSignal,
  newDeviceToken,
  type VoteClientSignals
} from "@/lib/vote-security";

const DEVICE_COOKIE = "rfl_vote_device";

function jsonWithDevice(body: Record<string, unknown>, status: number, deviceToken: string, shouldSet: boolean) {
  const response = NextResponse.json(body, { status });
  if (shouldSet) {
    response.cookies.set(DEVICE_COOKIE, deviceToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2
    });
  }
  return response;
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "Verified voting requires Supabase." }, { status: 503 });
  }
  if (process.env.NODE_ENV === "production" && (!process.env.TURNSTILE_SECRET || !process.env.VOTE_FRAUD_SECRET)) {
    return NextResponse.json({ error: "Production vote security is not fully configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as {
    contestId?: string;
    restaurantId?: string;
    turnstileToken?: string;
    clientSignals?: VoteClientSignals;
  } | null;
  if (!body?.contestId || !body.restaurantId) {
    return NextResponse.json({ error: "Choose a restaurant." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Verify your email before voting." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: appUser } = await admin
    .from("users")
    .select("id,email_verified_at,phone_e164,phone_verified_at,banned_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!appUser?.email_verified_at) return NextResponse.json({ error: "Verify your email before voting." }, { status: 403 });
  if (!appUser.phone_e164 || !appUser.phone_verified_at) return NextResponse.json({ error: "Verify your phone in Account before voting." }, { status: 403 });
  if (appUser.banned_at) return NextResponse.json({ error: "This account is not eligible to vote." }, { status: 403 });

  const existingDeviceToken = request.cookies.get(DEVICE_COOKIE)?.value;
  const deviceToken = existingDeviceToken || newDeviceToken();
  const shouldSetDeviceCookie = !existingDeviceToken;
  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const deviceHash = hashSignal("vote-device", deviceToken);
  const fingerprintHash = hashSignal("vote-fingerprint", fingerprintValue(userAgent, body.clientSignals));
  const ipHash = hashSignal("vote-ip", ip);

  const logAttempt = async (outcome: string, riskScore: number, reason: string) => {
    await admin.from("restaurant_vote_attempts").insert({
      contest_id: body.contestId,
      user_id: user.id,
      restaurant_id: body.restaurantId,
      device_hash: deviceHash,
      fingerprint_hash: fingerprintHash,
      ip_hash: ipHash,
      risk_score: riskScore,
      outcome,
      reason
    });
  };

  const turnstile = await verifyTurnstile(body.turnstileToken, "vote", ip);
  if (!turnstile.ok || (process.env.NODE_ENV === "production" && turnstile.skipped)) {
    await logAttempt("security_failed", 100, "Turnstile verification failed");
    return jsonWithDevice({ error: "Security verification failed." }, 400, deviceToken, shouldSetDeviceCookie);
  }

  const now = new Date().toISOString();
  const { data: contest } = await admin
    .from("contests")
    .select("id,ends_at,status")
    .eq("id", body.contestId)
    .eq("status", "open")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .maybeSingle();
  if (!contest) {
    await logAttempt("rejected", 0, "Contest unavailable or closed");
    return jsonWithDevice({ error: "This contest is not open." }, 409, deviceToken, shouldSetDeviceCookie);
  }

  const { data: eligibleRestaurant } = await admin
    .from("contest_restaurants")
    .select("restaurant_id")
    .eq("contest_id", body.contestId)
    .eq("restaurant_id", body.restaurantId)
    .maybeSingle();
  if (!eligibleRestaurant) {
    await logAttempt("rejected", 20, "Restaurant is not eligible for contest");
    return jsonWithDevice({ error: "That restaurant is not eligible in this contest." }, 400, deviceToken, shouldSetDeviceCookie);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentUserChanges } = await admin
    .from("restaurant_vote_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("contest_id", body.contestId)
    .gte("created_at", oneHourAgo);
  if ((recentUserChanges ?? 0) >= 5) {
    await logAttempt("rate_limited", 100, "Vote change limit exceeded");
    return jsonWithDevice({ error: "You can change your vote up to 5 times per hour." }, 429, deviceToken, shouldSetDeviceCookie);
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  let riskScore = 0;
  const reasons: string[] = [];
  const [sameDevice, sameFingerprint, sameIp, sameIpRestaurantBurst, existingVote] = await Promise.all([
    deviceHash ? admin.from("restaurant_votes").select("id,user_id").eq("contest_id", body.contestId).eq("device_hash", deviceHash).neq("user_id", user.id).in("status", ["counted", "held"]).limit(1) : Promise.resolve({ data: [] as any[] }),
    fingerprintHash ? admin.from("restaurant_votes").select("id,user_id").eq("contest_id", body.contestId).eq("fingerprint_hash", fingerprintHash).neq("user_id", user.id).in("status", ["counted", "held"]).limit(1) : Promise.resolve({ data: [] as any[] }),
    ipHash ? admin.from("restaurant_votes").select("id,user_id").eq("contest_id", body.contestId).eq("ip_hash", ipHash).neq("user_id", user.id).in("status", ["counted", "held"]).limit(5) : Promise.resolve({ data: [] as any[] }),
    ipHash ? admin.from("restaurant_vote_attempts").select("id", { count: "exact", head: true }).eq("contest_id", body.contestId).eq("restaurant_id", body.restaurantId).eq("ip_hash", ipHash).gte("created_at", fifteenMinutesAgo) : Promise.resolve({ count: 0 }),
    admin.from("restaurant_votes").select("restaurant_id,status").eq("contest_id", body.contestId).eq("user_id", user.id).maybeSingle()
  ]);

  if ((sameDevice.data?.length ?? 0) > 0) {
    riskScore += 60;
    reasons.push("device also used by another voter");
  }
  if ((sameFingerprint.data?.length ?? 0) > 0) {
    riskScore += 35;
    reasons.push("browser signature resembles another voter");
  }
  if ((sameIp.data?.length ?? 0) >= 3) {
    riskScore += 20;
    reasons.push("shared network has several voters");
  }
  if ((sameIpRestaurantBurst.count ?? 0) >= 3) {
    riskScore += 35;
    reasons.push("same-network burst for one restaurant");
  }
  if (Date.now() - new Date(user.created_at).getTime() < 10 * 60 * 1000) {
    riskScore += 15;
    reasons.push("very new account");
  }

  const voteStatus = riskScore >= 60 ? "held" : "counted";
  const { data: castResult, error: castError } = await admin.rpc("cast_restaurant_vote", {
    p_contest_id: body.contestId,
    p_user_id: user.id,
    p_restaurant_id: body.restaurantId,
    p_status: voteStatus,
    p_risk_score: riskScore,
    p_device_hash: deviceHash,
    p_fingerprint_hash: fingerprintHash,
    p_ip_hash: ipHash
  });
  if (castError) {
    await logAttempt("rejected", riskScore, castError.message || "Vote transaction failed");
    return jsonWithDevice({ error: "Unable to record your vote." }, 500, deviceToken, shouldSetDeviceCookie);
  }

  await logAttempt(voteStatus, riskScore, reasons.join("; ") || (existingVote.data ? "normal vote change" : "normal vote"));

  if (voteStatus === "held") {
    return jsonWithDevice({ ok: true, held: true, changed: Boolean(existingVote.data), vote: castResult?.[0] ?? null, message: "Your vote change was received and is being verified before it is counted." }, 202, deviceToken, shouldSetDeviceCookie);
  }
  return jsonWithDevice({ ok: true, held: false, changed: Boolean(existingVote.data), vote: castResult?.[0] ?? null, message: existingVote.data ? "Your vote was changed." : "Vote recorded." }, 200, deviceToken, shouldSetDeviceCookie);
}
