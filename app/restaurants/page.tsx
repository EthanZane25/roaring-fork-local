import type { Metadata } from "next";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getRestaurants } from "@/lib/data";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Restaurants",
  description: "Browse restaurants from Aspen to Rifle by town and primary cuisine.",
  alternates: { canonical: "/restaurants" }
};

export default async function RestaurantsPage({ searchParams }: { searchParams: Promise<{ town?: string; cuisine?: string }> }) {
  const filters = await searchParams;
  const restaurants = await getRestaurants({ town: filters.town });

  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Restaurants</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">Browse the corridor by primary cuisine. Use the town control in the header to narrow the whole site.</p>
      <RestaurantDirectory restaurants={restaurants} initialTown={filters.town} initialCuisine={filters.cuisine} />
    </main>
  );
}
