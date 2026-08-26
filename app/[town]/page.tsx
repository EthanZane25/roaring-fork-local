import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Home, ShoppingBag, Trophy, UtensilsCrossed, BriefcaseBusiness } from "lucide-react";
import { getListings, getRestaurants } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { RestaurantCard } from "@/components/restaurant-card";
import { ListingCard } from "@/components/listing-card";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) return { title: "Town not found" };
  return {
    title: `${town.name} Local Guide`,
    description: `${town.name} restaurants, classifieds, events, jobs, housing and community recommendations.`,
    alternates: { canonical: `/${town.slug}` }
  };
}

export default async function TownPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) notFound();

  const [restaurants, listings] = await Promise.all([
    getRestaurants({ town: slug, limit: 6 }),
    getListings({ town: slug, limit: 4 })
  ]);

  const sections = [
    ["Restaurants", `/${slug}/restaurants`, UtensilsCrossed],
    ["Marketplace", `/${slug}/marketplace`, ShoppingBag],
    ["Vote", `/vote?town=${slug}`, Trophy],
    ["Events", `/${slug}/events`, CalendarDays],
    ["Jobs", `/${slug}/jobs`, BriefcaseBusiness],
    ["Housing", `/${slug}/housing`, Home]
  ] as const;

  return (
    <main className="container-site py-12">
      <p className="eyebrow">{town.county} County</p>
      <h1 className="mt-3 text-5xl font-black tracking-[-.055em] sm:text-6xl">{town.name}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5c645c]">{town.tagline}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {sections.map(([label, href, Icon]) => (
          <Link key={href} href={href} className="card flex items-center gap-3 p-4 text-sm font-black transition hover:-translate-y-0.5">
            <Icon size={18} className="text-[#b8502f]" /> {label}
          </Link>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div><p className="eyebrow">Eat</p><h2 className="mt-2 text-3xl font-black">Restaurants in {town.name}</h2></div>
          <Link href={`/${slug}/restaurants`} className="text-sm font-black text-[#163b2d]">See all</Link>
        </div>
        {restaurants.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}</div>
        ) : (
          <div className="card p-8 text-sm text-[#626a62]">Restaurant data for {town.name} is ready to be added through the admin database.</div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div><p className="eyebrow">Marketplace</p><h2 className="mt-2 text-3xl font-black">For sale around {town.name}</h2></div>
          <Link href={`/${slug}/marketplace`} className="text-sm font-black text-[#163b2d]">Browse local listings</Link>
        </div>
        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{listings.map((x) => <ListingCard key={x.id} listing={x} />)}</div>
        ) : (
          <div className="card p-8 text-sm text-[#626a62]">No demo listings in {town.name} yet. Production listings appear here automatically.</div>
        )}
      </section>
    </main>
  );
}
