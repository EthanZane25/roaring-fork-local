import type { Metadata } from "next";

import { ValleyDropCard } from "@/components/valley-drop-card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Valley Drops",
  description:
    "Limited one-hour local deals from Roaring Fork Valley restaurants, shops and businesses."
};

type PublicDrop = {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  town_slug: string;
  address: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number | null;
  regular_price: number | null;
  quantity_total: number;
  starts_at: string;
  ends_at: string;
  state: string;
  claimed_count: number;
  remaining: number;
};

export default async function DealsPage() {
  const supabase = await createClient();

  const { data } = await supabase.rpc(
    "get_public_valley_drops"
  );

  const drops =
    (data ?? []) as PublicDrop[];

  const live = drops.filter(
    drop => drop.state === "live"
  );

  const upcoming = drops.filter(
    drop => drop.state === "scheduled"
  );

  return (
    <main className="bg-[#fbfaf7]">
      <section className="border-b border-[#dedfd9] bg-[#173f30] text-white">
        <div className="container-site py-12 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#dec77f]">
            Deals
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-[-.025em] sm:text-5xl">
            Valley Drops
          </h1>

          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/80">
            25 available. 60 minutes. Local businesses choose the offer and the time.
          </p>
        </div>
      </section>

      <div className="container-site py-10 sm:py-12">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-3xl">
              Live now
            </h2>

            <span className="text-sm text-[#727a74]">
              {live.length} active
            </span>
          </div>

          {live.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {live.map(drop => (
                <ValleyDropCard
                  key={drop.id}
                  drop={drop}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#cfd4ce] bg-white p-8">
              <strong className="block">
                No Valley Drop is live right now.
              </strong>

              <p className="mt-2 text-sm text-[#69716b]">
                A local deal can appear at any time.
              </p>
            </div>
          )}
        </section>

        {upcoming.length ? (
          <section className="mt-12">
            <h2 className="font-serif text-3xl">
              Coming up
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map(drop => (
                <ValleyDropCard
                  key={drop.id}
                  drop={drop}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
