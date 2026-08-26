import type { Metadata } from "next";
import { BedDouble, MapPin } from "lucide-react";
import { getHousing } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { currency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Housing",
  description: "Rooms, rentals and local housing listings from Aspen to Rifle."
};

export default async function HousingPage() {
  const listings = await getHousing();
  return (
    <main className="container-site py-12">
      <p className="eyebrow">Housing</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Local rooms & rentals</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">Transparent local housing listings with price shown up front.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <article key={listing.id} className="card p-6">
            <p className="eyebrow">{listing.type}</p>
            <p className="mt-3 text-2xl font-black">{currency(listing.price)}<span className="text-sm font-semibold text-[#6a726a]"> / mo</span></p>
            <h2 className="mt-2 text-lg font-black">{listing.title}</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#626a62]">
              <span className="flex items-center gap-1"><MapPin size={14} /> {getTown(listing.town)?.name}</span>
              <span className="flex items-center gap-1"><BedDouble size={14} /> {listing.bedrooms || "Studio"}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
