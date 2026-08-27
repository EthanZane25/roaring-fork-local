import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 70);
}

export async function POST(request: Request) {
  const form = await request.formData();

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "Preview listing accepted. Live listings are enabled when the site is connected to its production services."
    });
  }

  const token = String(form.get("cf-turnstile-response") || "");
  const turnstile = await verifyTurnstile(token, "create_listing");
  if (!turnstile.ok) {
    return NextResponse.json({ error: "Security verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in before posting a listing." }, { status: 401 });
  }

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const town = String(form.get("town") || "");
  const category = String(form.get("category") || "");
  const price = Number(form.get("price") || 0);
  const image = form.get("image");
  let imageUrl = "";

  if (title.length < 3 || description.length < 5 || !town || !category || Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Check the required listing fields." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,phone_verified")
    .eq("id", user.id)
    .maybeSingle();

  const listingId = crypto.randomUUID();
  const suffix = listingId.slice(0, 8);
  const slug = `${slugify(title)}-${suffix}`;

  if (image instanceof File && image.size > 0) {
    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be smaller than 8 MB." }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Photo must be JPEG, PNG or WebP." }, { status: 400 });
    }
    const safeName = image.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(-90);
    const storagePath = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("marketplace").upload(storagePath, image, {
      contentType: image.type,
      upsert: false
    });
    if (uploadError) {
      return NextResponse.json({ error: "Unable to upload listing photo." }, { status: 500 });
    }
    imageUrl = supabase.storage.from("marketplace").getPublicUrl(storagePath).data.publicUrl;
  }

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
    seller_verified: Boolean(profile?.phone_verified),
    status: "active"
  }).select("id,slug").single();

  if (error) {
    return NextResponse.json({ error: "Unable to create listing." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing });
}
