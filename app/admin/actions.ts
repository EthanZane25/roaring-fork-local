"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

type AdminContext = NonNullable<Awaited<ReturnType<typeof getAdminContext>>>;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullable(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new Error("Administrator access is required.");
  return ctx;
}

async function audit(ctx: AdminContext, action: string, targetType?: string, targetId?: string, metadata: Record<string, unknown> = {}) {
  await ctx.supabase.from("admin_audit_log").insert({
    actor_id: ctx.user.id,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    metadata
  });
}

const STATUS_RULES: Record<string, { values: readonly string[]; path: string }> = {
  advertisers: { values: ["prospect", "active", "inactive"], path: "/admin/advertising" },
  ad_campaigns: { values: ["draft", "active", "paused", "ended"], path: "/admin/advertising" },
  marketplace_listings: { values: ["draft", "active", "sold", "expired", "removed"], path: "/admin/marketplace" },
  jobs: { values: ["active", "filled", "expired", "removed"], path: "/admin/jobs" },
  housing_listings: { values: ["active", "rented", "expired", "removed"], path: "/admin/housing" },
  reports: { values: ["open", "reviewing", "resolved", "dismissed"], path: "/admin/reports" },
  restaurant_reviews: { values: ["published", "held", "removed"], path: "/admin/reports" }
};

export async function updateStatus(formData: FormData) {
  const ctx = await requireAdmin();
  const table = text(formData, "table");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const rule = STATUS_RULES[table];
  if (!rule || !id || !rule.values.includes(status)) throw new Error("Invalid status update.");

  const { error } = await ctx.supabase.from(table).update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  await audit(ctx, "status.update", table, id, { status });
  revalidatePath(rule.path);
  revalidatePath("/admin");
}

export async function setEventPublished(formData: FormData) {
  const ctx = await requireAdmin();
  const id = text(formData, "id");
  const published = text(formData, "published") === "true";
  if (!id) throw new Error("Missing event id.");
  const { error } = await ctx.supabase.from("events").update({ published }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(ctx, "event.publish", "events", id, { published });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/admin");
}

export async function setUserRole(formData: FormData) {
  const ctx = await requireAdmin();
  const id = text(formData, "id");
  const role = text(formData, "role");
  if (!id || !["user", "business", "moderator", "admin"].includes(role)) throw new Error("Invalid user role.");
  const { error } = await ctx.supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(ctx, "user.role", "profiles", id, { role });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function saveSiteSetting(formData: FormData) {
  const ctx = await requireAdmin();
  const key = text(formData, "key");
  const raw = text(formData, "value");
  if (!key || !raw) throw new Error("Setting key and value are required.");

  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error(`The value for ${key} is not valid JSON.`); }

  const { error } = await ctx.supabase.from("site_settings").upsert({
    key,
    value,
    updated_by: ctx.user.id,
    updated_at: new Date().toISOString()
  }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  await audit(ctx, "setting.save", "site_settings", key);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function createAdvertiser(formData: FormData) {
  const ctx = await requireAdmin();
  const businessName = text(formData, "business_name");
  if (!businessName) throw new Error("Business name is required.");

  const { data, error } = await ctx.supabase.from("advertisers").insert({
    business_name: businessName,
    contact_name: nullable(formData, "contact_name"),
    email: nullable(formData, "email"),
    phone: nullable(formData, "phone"),
    website: nullable(formData, "website"),
    notes: nullable(formData, "notes"),
    status: "prospect"
  }).select("id").single();
  if (error) throw new Error(error.message);

  await audit(ctx, "advertiser.create", "advertisers", data.id, { businessName });
  revalidatePath("/admin/advertising");
  revalidatePath("/admin");
}

export async function createCampaign(formData: FormData) {
  const ctx = await requireAdmin();
  const advertiserId = text(formData, "advertiser_id");
  const name = text(formData, "name");
  const placement = text(formData, "placement");
  const allowed = ["home_featured","home_sponsored","restaurants_featured","marketplace_featured","events_featured","jobs_featured","housing_featured","sitewide_banner"];
  if (!advertiserId || !name || !allowed.includes(placement)) throw new Error("Advertiser, campaign name and placement are required.");

  const priceRaw = text(formData, "monthly_price");
  const monthlyPrice = priceRaw ? Number(priceRaw) : null;
  if (priceRaw && !Number.isFinite(monthlyPrice)) throw new Error("Monthly price is invalid.");

  const { data, error } = await ctx.supabase.from("ad_campaigns").insert({
    advertiser_id: advertiserId,
    name,
    placement,
    town_slug: nullable(formData, "town_slug"),
    headline: text(formData, "headline"),
    body: text(formData, "body"),
    image_url: nullable(formData, "image_url"),
    destination_url: nullable(formData, "destination_url"),
    starts_at: nullable(formData, "starts_at"),
    ends_at: nullable(formData, "ends_at"),
    monthly_price: monthlyPrice,
    billing_notes: nullable(formData, "billing_notes"),
    status: "draft"
  }).select("id").single();
  if (error) throw new Error(error.message);

  await audit(ctx, "campaign.create", "ad_campaigns", data.id, { name, placement });
  revalidatePath("/admin/advertising");
  revalidatePath("/admin");
}

export async function createEvent(formData: FormData) {
  const ctx = await requireAdmin();
  const title = text(formData, "title");
  const townSlug = text(formData, "town_slug");
  const venue = text(formData, "venue");
  const startsAt = text(formData, "starts_at");
  if (!title || !townSlug || !venue || !startsAt) throw new Error("Title, town, venue and start time are required.");

  const { data, error } = await ctx.supabase.from("events").insert({
    title,
    description: text(formData, "description"),
    town_slug: townSlug,
    venue,
    category_slug: text(formData, "category_slug") || "community",
    starts_at: startsAt,
    ends_at: nullable(formData, "ends_at"),
    source_url: nullable(formData, "source_url"),
    image_url: nullable(formData, "image_url"),
    ticket_url: nullable(formData, "ticket_url"),
    published: true
  }).select("id").single();
  if (error) throw new Error(error.message);

  await audit(ctx, "event.create", "events", data.id, { title });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/admin");
}

export async function createJob(formData: FormData) {
  const ctx = await requireAdmin();
  const title = text(formData, "title");
  const company = text(formData, "company");
  const townSlug = text(formData, "town_slug");
  if (!title || !company || !townSlug) throw new Error("Title, company and town are required.");

  const { data, error } = await ctx.supabase.from("jobs").insert({
    title,
    company,
    town_slug: townSlug,
    description: text(formData, "description"),
    pay_text: text(formData, "pay_text"),
    employment_type: text(formData, "employment_type") || "Full time",
    status: "active"
  }).select("id").single();
  if (error) throw new Error(error.message);

  await audit(ctx, "job.create", "jobs", data.id, { title, company });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/admin");
}

export async function createHousing(formData: FormData) {
  const ctx = await requireAdmin();
  const title = text(formData, "title");
  const townSlug = text(formData, "town_slug");
  const listingType = text(formData, "listing_type");
  const price = Number(text(formData, "price"));
  const bedrooms = Number(text(formData, "bedrooms") || "0");
  if (!title || !townSlug || !listingType || !Number.isFinite(price) || price < 0) throw new Error("Title, town, type and valid price are required.");
  if (!Number.isFinite(bedrooms) || bedrooms < 0) throw new Error("Bedrooms are invalid.");

  const { data, error } = await ctx.supabase.from("housing_listings").insert({
    title,
    description: text(formData, "description"),
    town_slug: townSlug,
    price,
    bedrooms,
    listing_type: listingType,
    status: "active"
  }).select("id").single();
  if (error) throw new Error(error.message);

  await audit(ctx, "housing.create", "housing_listings", data.id, { title });
  revalidatePath("/admin/housing");
  revalidatePath("/housing");
  revalidatePath("/admin");
}
