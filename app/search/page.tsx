import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { RestaurantCard } from "@/components/restaurant-card";
import { getListings, getRestaurants } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true }
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const normalized = q.trim().toLowerCase();
  const [restaurants, listings] = await Promise.all([getRestaurants(), getListings()]);
  const restaurantMatches = normalized ? restaurants.filter((r) => [r.name, r.description, r.town, ...r.cuisines, ...r.tags].join(" ").toLowerCase().includes(normalized)) : [];
  const listingMatches = normalized ? listings.filter((x) => [x.title, x.description, x.town, x.category].join(" ").toLowerCase().includes(normalized)) : [];

  return (
    <main className="container-site py-12">
      <p className="eyebrow">Search</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Search the valley</h1>
      <form className="mt-7 flex max-w-2xl gap-2">
        <input name="q" defaultValue={q} className="min-w-0 flex-1 rounded-xl border border-[#d6d8d1] bg-white px-4 py-3" placeholder="pizza, mountain bike, Aspen..." />
        <button className="rounded-xl bg-[#163b2d] px-5 py-3 text-sm font-black text-white">Search</button>
      </form>
      {normalized ? (
        <>
          <section className="mt-10">
            <h2 className="text-2xl font-black">Restaurants <span className="text-[#7a827a]">({restaurantMatches.length})</span></h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{restaurantMatches.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}</div>
          </section>
          <section className="mt-12">
            <h2 className="text-2xl font-black">Marketplace <span className="text-[#7a827a]">({listingMatches.length})</span></h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{listingMatches.map((x) => <ListingCard key={x.id} listing={x} />)}</div>
          </section>
        </>
      ) : <p className="mt-8 text-[#626a62]">Enter a search above.</p>}
    </main>
  );
}
