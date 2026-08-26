import type { Metadata } from "next";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getRestaurants } from "@/lib/data";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Restaurants",
  description: "Search restaurants from Aspen to Rifle by town, cuisine, meal, price and local recommendations.",
  alternates: { canonical: "/restaurants" }
};

export default async function RestaurantsPage() {
  const restaurants = await getRestaurants();

  return (
    <main className="container-site py-10 sm:py-12">
      <p className="eyebrow">Aspen to Rifle</p>
      <div className="mt-2 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Restaurants</h1>
        <p className="mt-3 leading-7 text-[#5e665e]">Search the valley without scrolling through hundreds of restaurant cards. Filter the directory or let the restaurant finder narrow it down for you.</p>
      </div>

      <RestaurantDirectory restaurants={restaurants} />
    </main>
  );
}
