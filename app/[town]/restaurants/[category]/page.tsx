import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantRow } from "@/components/restaurant-row";
import { SponsoredRestaurantCard } from "@/components/sponsored-restaurant-card";
import { getRestaurants } from "@/lib/data";
import { getTown, RESTAURANT_CATEGORIES, titleize } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string; category: string }> }): Promise<Metadata> {
  const { town: townSlug, category } = await params;
  const town = getTown(townSlug);
  if (!town || !RESTAURANT_CATEGORIES.includes(category)) return { title: "Restaurants" };
  const results = await getRestaurants({ town: townSlug, category });
  const shouldIndex = results.length >= 3;
  return {
    title: `${titleize(category)} in ${town.name}`,
    description: `Find ${titleize(category).toLowerCase()} options in ${town.name}, Colorado with local recommendations and current business details.`,
    alternates: { canonical: `/${townSlug}/restaurants/${category}` },
    robots: { index: shouldIndex, follow: true }
  };
}

export default async function RestaurantCategoryPage({ params }: { params: Promise<{ town: string; category: string }> }) {
  const { town: townSlug, category } = await params;
  const town = getTown(townSlug);
  if (!town || !RESTAURANT_CATEGORIES.includes(category)) notFound();
  const results = await getRestaurants({ town: townSlug, category });
  const advertisers = results.filter((restaurant) => restaurant.isAdvertiser && restaurant.imageUrl);

  return (
    <main className="container-site py-10 sm:py-12">
      <p className="eyebrow">{town.name} dining</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.02em] sm:text-4xl">{titleize(category)} in {town.name}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#5e665e]">
        Browse current {titleize(category).toLowerCase()} options in {town.name}. Free restaurant listings are text-only; paid advertising placements are clearly labeled Sponsored.
      </p>

      {advertisers.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Featured restaurants</h2>
          <p className="mt-1 text-xs text-[#6b716c]">Sponsored placements</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advertisers.slice(0, 3).map((restaurant) => <SponsoredRestaurantCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="border-b border-[#cfd2cc] pb-3">
          <h2 className="text-lg font-semibold">All {titleize(category)} restaurants</h2>
          <p className="mt-1 text-xs text-[#6b716c]">{results.length} matching restaurants</p>
        </div>
        {results.length ? (
          <div className="bg-white">
            {results.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
          </div>
        ) : (
          <div className="border-b border-[#dfe1db] py-8 text-sm text-[#616961]">No matching restaurants have been published yet.</div>
        )}
      </section>
    </main>
  );
}
