import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { getTown, titleize } from "@/lib/constants";

export function SponsoredRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  if (!restaurant.isAdvertiser || !restaurant.imageUrl) return null;

  const town = getTown(restaurant.town);

  return (
    <article className="overflow-hidden border border-[#d7d9d3] bg-white">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-[#ecece7]">
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <span className="absolute left-2 top-2 bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4d544f]">
            Sponsored
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-[17px] font-semibold">{restaurant.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#666c67]">
            <MapPin size={13} /> {town?.name} · {"$".repeat(restaurant.priceLevel)}
          </p>
          <p className="mt-2 text-sm text-[#555c56]">
            {restaurant.cuisines.slice(0, 2).map(titleize).join(" · ") || "Restaurant"}
            {restaurant.openNow !== undefined ? ` · ${restaurant.openNow ? "Open now" : "Closed"}` : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}
