import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewListingForm } from "@/components/new-listing-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Post a Local Classified",
  robots: { index: false, follow: true }
};

export default async function NewMarketplaceListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/marketplace/new");
  }

  const [{ data: identity }, { count }] = await Promise.all([
    supabase
      .from("users")
      .select("phone_e164,phone_verified_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
  ]);

  const phoneVerified = Boolean(identity?.phone_verified_at && identity?.phone_e164);
  const last4 = identity?.phone_e164?.slice(-4) || null;
  const requiresFreshCode = (count ?? 0) === 0;

  return (
    <main className="container-site max-w-3xl py-12">
      <p className="eyebrow">Marketplace</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.02em]">Post a local listing</h1>
      <p className="mt-4 mb-8 text-[#5f675f]">
        Listings are intended for local pickup or exchange in the Aspen-to-Rifle corridor.
      </p>
      <NewListingForm
        phoneVerified={phoneVerified}
        phoneLast4={last4}
        requiresFreshCode={requiresFreshCode}
      />
    </main>
  );
}
