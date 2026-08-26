import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/data";
import { getTown, MARKETPLACE_CATEGORIES, titleize } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string; category: string }> }): Promise<Metadata> {
  const { town: townSlug, category } = await params;
  const town = getTown(townSlug);
  if (!town || !MARKETPLACE_CATEGORIES.includes(category)) return { title: "Marketplace" };
  const listings = await getListings({ town: townSlug, category });
  return {
    title: `${titleize(category)} for Sale in ${town.name}`,
    description: `Browse current ${titleize(category).toLowerCase()} classifieds in ${town.name}, Colorado.`,
    alternates: { canonical: `/${townSlug}/marketplace/${category}` },
    robots: { index: listings.length >= 3, follow: true }
  };
}

export default async function TownMarketplaceCategoryPage({ params }: { params: Promise<{ town: string; category: string }> }) {
  const { town: townSlug, category } = await params;
  const town = getTown(townSlug);
  if (!town || !MARKETPLACE_CATEGORIES.includes(category)) notFound();
  const listings = await getListings({ town: townSlug, category });

  return (
    <main className="container-site py-12">
      <p className="eyebrow">{town.name} marketplace</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">{titleize(category)} in {town.name}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">Current local listings in {town.name}. Thin category pages stay out of Google until there are enough active listings to be useful.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
      {!listings.length ? <div className="card mt-8 p-8 text-sm text-[#606860]">No active listings in this category.</div> : null}
    </main>
  );
}
