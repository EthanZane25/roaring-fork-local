import type { Metadata } from "next";
import { getHousing } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { currency } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Housing",
  description: "Local rooms and housing listings from Aspen to Rifle."
};

export default async function HousingPage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const liveInventory = hasSupabaseEnv();

  if (!liveInventory) {
    return (
      <main className="container-site py-14 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Housing</h1>
          <p className="mt-4 text-[16px] leading-7 text-[#5e665e]">The housing inventory is being built now. This page will open when there are enough verified, current local listings to make it useful.</p>
        </div>
      </main>
    );
  }

  const listings = await getHousing({ town });
  const townName = town ? getTown(town)?.name : undefined;

  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Housing</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">
        {townName ? `Current rooms and rentals in ${townName}.` : "Current local rooms and rentals from Aspen to Rifle."}
      </p>

      <div className="mt-9 border-y border-[#d9dbd5] bg-white">
        {listings.map((listing, index) => (
          <article key={listing.id} className={`grid gap-2 py-4 sm:grid-cols-[160px_1fr_190px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
            <span className="text-[13px] font-semibold text-[#667068]">{getTown(listing.town)?.name}</span>
            <div>
              <h2 className="text-[16px] font-semibold">{listing.title}</h2>
              <p className="mt-1 text-[13px] text-[#737a74]">{listing.type} · {listing.bedrooms || "Studio"} bedrooms</p>
            </div>
            <span className="text-[13px] text-[#5f665f] sm:text-right">{currency(listing.price)} / mo</span>
          </article>
        ))}
        {!listings.length ? <p className="py-6 text-sm text-[#606860]">No active housing listings match this town right now.</p> : null}
      </div>
    </main>
  );
}
