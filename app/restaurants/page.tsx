import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getRestaurants } from "@/lib/data";
import { cuisineLabel, getTown } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Best Roaring Fork Valley Restaurants",
  description: "Find restaurants from Aspen to Rifle by town, open now, price, meal and cuisine.",
  alternates: { canonical: "/restaurants" }
};

export default async function RestaurantsPage({
  searchParams
}: {
  searchParams: Promise<{ town?: string; cuisine?: string; open?: string }>;
}) {
  const filters = await searchParams;
  const restaurants = await getRestaurants();
  const topPool = filters.town ? restaurants.filter((restaurant) => restaurant.town === filters.town) : restaurants;
  const top = [...topPool].sort((a, b) => b.localVotes - a.localVotes).slice(0, 3);

  return (
    <main className="bg-[#fbfaf7]">
      <section className="border-b border-[#e0e3de] bg-white">
        <div className="container-site py-9 sm:py-11">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#8b6b22]">Eat local</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Where should we eat?</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#626b64]">
            Filter by what matters right now: open, nearby, price, meal and cuisine.
          </p>

          {top.length ? (
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {top.map((restaurant, index) => (
                <Link href={`/restaurants/${restaurant.slug}`} key={restaurant.id} className="group overflow-hidden rounded-xl border border-[#dde2dc] bg-white">
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#e9ebe7]">
                    {restaurant.imageUrl ? <Image src={restaurant.imageUrl} alt={restaurant.name} fill className="object-cover transition duration-500 group-hover:scale-[1.025]" sizes="33vw" /> : null}
                    <span className="absolute left-3 top-3 rounded-md bg-white/94 px-2.5 py-1 text-[11px] font-bold">#{index + 1} by local votes</span>
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold">{restaurant.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#6c746e]"><MapPin size={12} /> {getTown(restaurant.town)?.name} · {cuisineLabel(restaurant.cuisine)}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                      {restaurant.openNow === true ? <span className="rounded-full bg-[#e8f2ea] px-2 py-1 text-[#2d6546]">Open now</span> : null}
                      {restaurant.verifiedAt ? <span className="inline-flex items-center gap-1 text-[#527061]"><BadgeCheck size={13} /> Listing verified</span> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-site py-8 sm:py-9">
        <RestaurantDirectory
          restaurants={restaurants}
          initialTown={filters.town}
          initialCuisine={filters.cuisine}
          initialOpen={filters.open === "1"}
        />
      </section>
    </main>
  );
}
