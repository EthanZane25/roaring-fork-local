import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/data";
import { MARKETPLACE_CATEGORIES, TOWNS, titleize } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Marketplace",
  description: "Local classifieds from Aspen to Rifle. Buy and sell furniture, vehicles, bikes, ski gear and more."
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ town?: string; category?: string }> }) {
  const filters = await searchParams;
  const listings = await getListings({ town: filters.town, category: filters.category });
  return (
    <main className="container-site py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Local classifieds</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Marketplace</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">Buy and sell locally from Aspen to Rifle without sorting through Front Range listings.</p>
        </div>
        <Link href="/marketplace/new" className="inline-flex items-center gap-2 rounded-full bg-[#163b2d] px-5 py-3 text-sm font-black text-white"><Plus size={17} /> Post a listing</Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/marketplace" className="rounded-full border border-[#d7d9d2] bg-white px-4 py-2 text-sm font-bold">All</Link>
        {MARKETPLACE_CATEGORIES.map((category) => (
          <Link key={category} href={`/marketplace?category=${category}${filters.town ? `&town=${filters.town}` : ""}`} className="rounded-full border border-[#d7d9d2] bg-white px-4 py-2 text-sm font-bold">{titleize(category)}</Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {TOWNS.map((town) => (
          <Link key={town.slug} href={`/marketplace?town=${town.slug}${filters.category ? `&category=${filters.category}` : ""}`} className="rounded-full bg-[#ecebe5] px-3 py-1.5 text-xs font-bold">{town.name}</Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
      {!listings.length ? <div className="card mt-8 p-8 text-sm text-[#606860]">No active listings match those filters.</div> : null}
    </main>
  );
}
