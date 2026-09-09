"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TOWNS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

function fail(message: string): never {
  redirect(`/merchant?error=${encodeURIComponent(message)}`);
}

export async function applyForMerchant(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/merchant");
  }

  const businessName = String(
    formData.get("businessName") || ""
  ).trim();

  const businessType = String(
    formData.get("businessType") || "shop"
  );

  const town = String(
    formData.get("town") || ""
  );

  const address = String(
    formData.get("address") || ""
  ).trim();

  if (businessName.length < 2) {
    fail("Enter your business name.");
  }

  if (!TOWNS.some((item) => item.slug === town)) {
    fail("Choose a town.");
  }

  const allowedTypes = [
    "restaurant",
    "shop",
    "service",
    "activity",
    "other"
  ];

  if (!allowedTypes.includes(businessType)) {
    fail("Choose a business type.");
  }

  const { data: existing } = await supabase
    .from("merchant_businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/merchant");
  }

  const { error } = await supabase
    .from("merchant_businesses")
    .insert({
      owner_id: user.id,
      business_name: businessName,
      business_type: businessType,
      town_slug: town,
      address,
      status: "pending"
    });

  if (error) {
    fail("We couldn’t submit your business.");
  }

  revalidatePath("/merchant");
  redirect("/merchant?applied=1");
}

export async function createDeal(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/merchant");
  }

  const { data: business } = await supabase
    .from("merchant_businesses")
    .select("id,status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    fail("Add your business first.");
  }

  if (business.status !== "approved") {
    fail("Your business must be approved before posting deals.");
  }

  const title = String(
    formData.get("title") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const dealPriceRaw = String(
    formData.get("dealPrice") || ""
  ).trim();

  const regularPriceRaw = String(
    formData.get("regularPrice") || ""
  ).trim();

  if (title.length < 3) {
    fail("Enter a short deal title.");
  }

  if (description.length < 5) {
    fail("Add a short description.");
  }

  const dealPrice = dealPriceRaw
    ? Number(dealPriceRaw)
    : null;

  const regularPrice = regularPriceRaw
    ? Number(regularPriceRaw)
    : null;

  if (
    dealPrice !== null &&
    (!Number.isFinite(dealPrice) || dealPrice < 0)
  ) {
    fail("Check the deal price.");
  }

  if (
    regularPrice !== null &&
    (!Number.isFinite(regularPrice) || regularPrice < 0)
  ) {
    fail("Check the regular price.");
  }

  const startsAt = new Date();

  const endsAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  const { error } = await supabase
    .from("deal_drops")
    .insert({
      business_id: business.id,
      title,
      description,
      discount_type: "special",
      deal_price: dealPrice,
      regular_price: regularPrice,
      quantity_total: 25,
      duration_minutes: 1440,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      redemption_ends_at: endsAt.toISOString(),
      one_per_user: true,
      status: "live",
      created_by: user.id
    });

  if (error) {
    fail("We couldn’t publish that deal.");
  }

  revalidatePath("/merchant");
  revalidatePath("/deals");

  redirect("/merchant?posted=1");
}
