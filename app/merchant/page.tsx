import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MerchantPortal } from "@/components/merchant-portal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Merchant dashboard",
  robots: {
    index: false,
    follow: false
  }
};

export default async function MerchantPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/merchant/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: businessesData } = await supabase
    .from("merchant_businesses")
    .select(
      "id,business_name,business_type,town_slug,address,status"
    )
    .eq("owner_id", user.id)
    .order("created_at", {
      ascending: true
    });

  const businesses =
    (businessesData ?? []) as Array<{
      id: string;
      business_name: string;
      business_type: string;
      town_slug: string;
      address: string;
      status: string;
    }>;

  const businessIds = businesses.map(
    business => business.id
  );

  let dealRows: Array<{
    id: string;
    business_id: string;
    title: string;
    discount_type: string;
    discount_value: number | null;
    regular_price: number | null;
    starts_at: string;
    ends_at: string;
    status: string;
  }> = [];

  if (businessIds.length) {
    const { data } = await supabase
      .from("deal_drops")
      .select(
        "id,business_id,title,discount_type,discount_value,regular_price,starts_at,ends_at,status"
      )
      .in("business_id", businessIds)
      .order("starts_at", {
        ascending: false
      });

    dealRows = (data ?? []) as typeof dealRows;
  }

  const dealIds = dealRows.map(deal => deal.id);

  const secretMap = new Map<string, string>();
  const claimCounts = new Map<string, number>();
  const redeemedCounts = new Map<string, number>();

  if (dealIds.length) {
    const [{ data: secrets }, { data: claims }] =
      await Promise.all([
        supabase
          .from("deal_drop_secrets")
          .select("deal_id,secret_word")
          .in("deal_id", dealIds),

        supabase
          .from("deal_claims")
          .select("deal_id,status")
          .in("deal_id", dealIds)
      ]);

    for (const item of (secrets ?? []) as Array<{
      deal_id: string;
      secret_word: string;
    }>) {
      secretMap.set(
        item.deal_id,
        item.secret_word
      );
    }

    for (const claim of (claims ?? []) as Array<{
      deal_id: string;
      status: string;
    }>) {
      if (
        claim.status === "claimed" ||
        claim.status === "redeemed"
      ) {
        claimCounts.set(
          claim.deal_id,
          (claimCounts.get(claim.deal_id) ?? 0) +
            1
        );
      }

      if (claim.status === "redeemed") {
        redeemedCounts.set(
          claim.deal_id,
          (redeemedCounts.get(claim.deal_id) ??
            0) + 1
        );
      }
    }
  }

  const deals = dealRows.map(deal => ({
    ...deal,
    secretWord: secretMap.get(deal.id),
    claimCount:
      claimCounts.get(deal.id) ?? 0,
    redeemedCount:
      redeemedCounts.get(deal.id) ?? 0
  }));

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            Roaring Fork Local
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-[-.025em]">
            Merchant dashboard
          </h1>

          <p className="mt-3 text-sm text-[#657068]">
            {profile?.display_name ||
              user.email ||
              "Merchant account"}
          </p>
        </div>

        <div className="flex gap-4 text-sm font-semibold text-[#173f30]">
          <Link
            href="/deals"
            className="hover:underline"
          >
            View Deals
          </Link>

          <Link
            href="/"
            className="hover:underline"
          >
            View site →
          </Link>
        </div>
      </div>

      <MerchantPortal
        businesses={businesses}
        deals={deals}
      />
    </main>
  );
}
