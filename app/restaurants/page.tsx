import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { RestaurantDirectory } from "@/components/restaurant-directory";
import { getRestaurants } from "@/lib/data";
import { cuisineLabel, getTown } from "@/lib/constants";

export const metadata: Metadata = { title: "Best Roaring Fork Valley Restaurants", description: "Curated restaurant guide from Aspen to Rifle with useful local details, cuisine filters and verified information.", alternates: { canonical: "/restaurants" } };

export default async function RestaurantsPage({ searchParams }: { searchParams: Promise<{ town?: string; cuisine?: string }> }) {
  const filters = await searchParams;
  const restaurants = await getRestaurants({ town: filters.town });
  const top = [...restaurants].sort((a,b)=>b.localVotes-a.localVotes).slice(0,3);
  return (
    <main className="bg-[#fbfaf7]">
      <section className="border-b border-[#e0e3de] bg-white"><div className="container-site py-10 sm:py-12"><p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#8b6b22]">Eat local</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Restaurants worth knowing</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#626b64]">A practical valley-wide guide focused on where people actually want to eat—current details, useful filters and local context.</p>{top.length ? <div className="mt-7 grid gap-4 md:grid-cols-3">{top.map((restaurant,index)=><Link href={`/restaurants/${restaurant.slug}`} key={restaurant.id} className="group overflow-hidden rounded-xl border border-[#dde2dc] bg-white"><div className="relative aspect-[16/10] overflow-hidden bg-[#e9ebe7]">{restaurant.imageUrl ? <Image src={restaurant.imageUrl} alt={restaurant.name} fill className="object-cover transition duration-500 group-hover:scale-[1.025]" sizes="33vw" /> : null}<span className="absolute left-3 top-3 rounded-md bg-white/94 px-2.5 py-1 text-[11px] font-bold">#{index+1} local pick</span></div><div className="p-4"><h2 className="text-lg font-semibold">{restaurant.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-[#6c746e]"><MapPin size={12} /> {getTown(restaurant.town)?.name} · {cuisineLabel(restaurant.cuisine)}</p>{restaurant.verifiedAt ? <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#527061]"><BadgeCheck size={13} /> Verified listing</p> : null}</div></Link>)}</div> : null}</div></section>
      <section className="container-site py-9"><RestaurantDirectory restaurants={restaurants} initialTown={filters.town} initialCuisine={filters.cuisine} /></section>
    </main>
  );
}
