import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { DEVICE_COOKIE_NAME } from "@/lib/device-security";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit, recordRateEvent } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";
import { getClientIp, getNetworkPrefix, hashSignal } from "@/lib/vote-security";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 70);
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "Preview listing accepted. Live listings are enabled when the site is connected to its production services."
    });
  }

  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "Marketplace security services are not configured." }, { status: 503 });
  }

  const ip = getClientIp(request.headers);
  const network = getNetworkPrefix(ip);
  const deviceToken = request.cookies.get(DEVICE_COOKIE_NAME)?.value || null;
  const userAgent = request.headers.get("user-agent") || "";

  const deviceHash = hashSignal("device-cookie", deviceToken);
  const ipHash = hashSignal("listing-ip", ip);
  const networkHash = hashSignal("listing-network", network);
  const userAgentHash = hashSignal("listing-user-agent", userAgent);

  if (!deviceHash) {
    return NextResponse.json({ error: "Refresh the page before posting a listing." }, { status: 400 });
  }

  const form = await request.formData();
  const token = String(form.get("cf-turnstile-response") || "");
  const turnstile = await verifyTurnstile(token, "create_listing", ip);

  if (!turnstile.ok || (process.env.NODE_ENV === "production" && turnstile.skipped)) {
    return NextResponse.json({ error: "Security verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Sign in before posting a listing." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: identity, error: identityError } = await admin
    .from("users")
    .select("email_verified_at,phone_e164,phone_verified_at,banned_at,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (identityError) {
    return NextResponse.json({ error: "Unable to verify your account security status." }, { status: 503 });
  }

  if (identity?.banned_at) {
    return NextResponse.json({ error: "This account cannot post Marketplace listings." }, { status: 403 });
  }

  if (!identity?.email_verified_at) {
    return NextResponse.json({ error: "Verify your email before posting a listing." }, { status: 403 });
  }

  if (!identity.phone_verified_at || !identity.phone_e164) {
    return NextResponse.json({
      error: "Verify a mobile number before posting a listing.",
      code: "PHONE_VERIFICATION_REQUIRED"
    }, { status: 403 });
  }

  const userHash = hashSignal("listing-user", user.id);

  try {
    const [userRate, deviceRate, ipRate, networkRate] = await Promise.all([
      checkRateLimit("listing_user", userHash, 3, 24 * 60 * 60 * 1000),
      checkRateLimit("listing_device", deviceHash, 5, 24 * 60 * 60 * 1000),
      checkRateLimit("listing_ip", ipHash, 10, 60 * 60 * 1000),
      checkRateLimit("listing_network", networkHash, 20, 60 * 60 * 1000)
    ]);

    if (!userRate.allowed || !deviceRate.allowed || !ipRate.allowed || !networkRate.allowed) {
      await recordSecurityEvent({
        eventType: "listing_create",
        userId: user.id,
        deviceHash,
        ipHash,
        networkHash,
        userAgentHash,
        decision: "rate_limited"
      });

      return NextResponse.json({ error: "Too many listing attempts. Try again later." }, { status: 429 });
    }

    // IP and network limits track posting attempts. Account and device
    // quotas are recorded only after a listing is successfully created.
    await Promise.all([
      recordRateEvent("listing_ip", ipHash),
      recordRateEvent("listing_network", networkHash)
    ]);
  } catch {
    return NextResponse.json({ error: "Marketplace security controls are temporarily unavailable." }, { status: 503 });
  }

  const { count: priorListingCount, error: countError } = await admin
    .from("marketplace_listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    return NextResponse.json({ error: "Unable to verify listing history." }, { status: 503 });
  }

  const firstListing = (priorListingCount ?? 0) === 0;
  let stepupId: string | null = null;

  if (firstListing) {
    const { data: stepup, error: stepupError } = await admin
      .from("security_stepups")
      .select("id")
      .eq("user_id", user.id)
      .eq("purpose", "create_listing")
      .eq("device_hash", deviceHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stepupError || !stepup) {
      return NextResponse.json({
        error: "Enter the fresh SMS code before publishing your first listing.",
        code: "PHONE_STEPUP_REQUIRED"
      }, { status: 403 });
    }

    stepupId = stepup.id;
  }

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const town = String(form.get("town") || "");
  const category = String(form.get("category") || "");
  const price = Number(form.get("price") || 0);
  const image = form.get("image");

  if (title.length < 3 || description.length < 5 || !town || !category || Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Check the required listing fields." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const listingId = crypto.randomUUID();
  const suffix = listingId.slice(0, 8);
  const slug = `${slugify(title)}-${suffix}`;
  let imageUrl = "";
  let storagePath: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be smaller than 8 MB." }, { status: 400 });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Photo must be JPEG, PNG or WebP." }, { status: 400 });
    }

    const safeName = image.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(-90);
    storagePath = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("marketplace").upload(storagePath, image, {
      contentType: image.type,
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ error: "Unable to upload listing photo." }, { status: 500 });
    }

    imageUrl = supabase.storage.from("marketplace").getPublicUrl(storagePath).data.publicUrl;
  }

  const listingStatus = firstListing ? "held" : "active";

  const { data: listing, error } = await supabase.from("marketplace_listings").insert({
    id: listingId,
    owner_id: user.id,
    slug,
    title,
    description,
    town_slug: town,
    category_slug: category,
    price,
    image_url: imageUrl || null,
    seller_name: profile?.display_name || "Local seller",
    seller_verified: true,
    status: listingStatus
  }).select("id,slug,status").single();

  if (error) {
    if (storagePath) {
      await supabase.storage.from("marketplace").remove([storagePath]);
    }
    return NextResponse.json({ error: "Unable to create listing." }, { status: 500 });
  }

  if (stepupId) {
    await admin
      .from("security_stepups")
      .update({ used_at: new Date().toISOString() })
      .eq("id", stepupId)
      .eq("user_id", user.id);
  }

  await Promise.all([
    recordRateEvent("listing_user", userHash),
    recordRateEvent("listing_device", deviceHash)
  ]);

  await recordSecurityEvent({
    eventType: "listing_create",
    userId: user.id,
    listingId: listing.id,
    deviceHash,
    ipHash,
    networkHash,
    userAgentHash,
    decision: listingStatus,
    details: {
      firstListing,
      turnstileSkipped: Boolean(turnstile.skipped)
    }
  });

  return NextResponse.json({ ok: true, listing });
}
