"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TOWNS } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const WORK_TYPES = new Set(["Full time", "Part time", "Seasonal", "Contract", "Temporary"]);

function fail(kind: "hiring" | "work_wanted", message: string): never {
  redirect(`/jobs/new?kind=${kind}&error=${encodeURIComponent(message)}`);
}

function normalizeUrl(value: string) {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function createJobListing(formData: FormData) {
  const kind =
    formData.get("listingType") === "work_wanted"
      ? "work_wanted"
      : "hiring";

  if (!hasSupabaseEnv()) {
    fail(kind, "Posting is not available in this environment yet.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/jobs/new?kind=${kind}`)}`);
  }

  const title = String(formData.get("title") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const town = String(formData.get("town") || "");
  const employmentType = String(formData.get("employmentType") || "");
  const pay = String(formData.get("pay") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const rawApplyUrl = String(formData.get("applyUrl") || "").trim();
  const applyUrl = normalizeUrl(rawApplyUrl);

  if (title.length < 3 || title.length > 100) {
    fail(kind, "Use a clear title between 3 and 100 characters.");
  }

  if (company.length < 2 || company.length > 100) {
    fail(
      kind,
      kind === "hiring"
        ? "Add the business or organization name."
        : "Add your name."
    );
  }

  if (!TOWNS.some((item) => item.slug === town)) {
    fail(kind, "Choose a town from the list.");
  }

  if (!WORK_TYPES.has(employmentType)) {
    fail(kind, "Choose a work type from the list.");
  }

  if (pay.length > 100) {
    fail(kind, "Keep the pay information under 100 characters.");
  }

  if (description.length < 10 || description.length > 2000) {
    fail(kind, "Add a short description between 10 and 2,000 characters.");
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    fail(kind, "Check the contact email address.");
  }

  if (phone && (phone.length < 7 || phone.length > 30)) {
    fail(kind, "Check the contact phone number.");
  }

  if (rawApplyUrl && !applyUrl) {
    fail(kind, "Check the application link.");
  }

  if (!email && !phone && !applyUrl) {
    fail(kind, "Add at least one way for people to respond.");
  }

  const expiresAt = new Date(
    Date.now() + 45 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from("jobs").insert({
    owner_id: user.id,
    title,
    company,
    town_slug: town,
    description,
    pay_text: pay,
    employment_type: employmentType,
    listing_type: kind,
    contact_email: email || null,
    contact_phone: phone || null,
    apply_url: kind === "hiring" ? applyUrl : null,
    expires_at: expiresAt,
    status: "active"
  });

  if (error) {
    fail(kind, "We couldn’t publish that listing. Please try again.");
  }

  revalidatePath("/jobs");

  redirect(
    `/jobs?view=${kind === "work_wanted" ? "work" : "jobs"}&posted=1`
  );
}
