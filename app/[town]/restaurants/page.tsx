import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantCard } from "@/components/restaurant-card";
import { getRestaurants } from "@/lib/data";
import { getTown, RESTAURANT_CATEGORIES, titleize } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) return { title: "Restaurants" };
  return {
    title: `${town.name} Restaurants`,
    description: `Browse restaurants in ${town.name}, Colorado with local votes, cuisine filters and verification details.`,
    alternates: { canonical: `/${slug}/restaurants` }
  };
}

export default async function TownRestaurantsPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) notFound();
  const restaurants = await getRestaurants({ town: slug });

  return (
    <main className="container-site py-12">
      <p className="eyebrow">Dining guide</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">{town.name} restaurants</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">Menus, price levels, local votes and recently verified information for dining in {town.name}.</p>
      <div className="mt-7 flex flex-wrap gap-2">
        {RESTAURANT_CATEGORIES.map((category) => (
          <Link key={category} href={`/${slug}/restaurants/${category}`} className="rounded-full border border-[#d7d9d2] bg-white px-4 py-2 text-sm font-bold">
            {titleize(category)}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
      </div>
    </main>
  );
}
