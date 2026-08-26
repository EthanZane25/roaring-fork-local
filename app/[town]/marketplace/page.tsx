import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/data";
import { getTown, MARKETPLACE_CATEGORIES, titleize } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) return { title: "Marketplace" };
  return {
    title: `${town.name} Classifieds & Marketplace`,
    description: `Local items for sale, free stuff and classifieds in ${town.name}, Colorado.`,
    alternates: { canonical: `/${slug}/marketplace` }
  };
}

export default async function TownMarketplacePage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) notFound();
  const listings = await getListings({ town: slug });

  return (
    <main className="container-site py-12">
      <p className="eyebrow">{town.name} classifieds</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">{town.name} Marketplace</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">Buy and sell locally around {town.name}. Listings are organized for local pickup and valley-wide discovery.</p>
      <div className="mt-7 flex flex-wrap gap-2">
        {MARKETPLACE_CATEGORIES.map((category) => (
          <Link key={category} href={`/${slug}/marketplace/${category}`} className="rounded-full border border-[#d7d9d2] bg-white px-4 py-2 text-sm font-bold">{titleize(category)}</Link>
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
      {!listings.length ? <div className="card mt-8 p-8 text-sm text-[#606860]">No active listings in {town.name} yet.</div> : null}
    </main>
  );
}
