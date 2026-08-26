import Link from "next/link";
import { MapPin, ThumbsUp } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { getTown, titleize } from "@/lib/constants";
import { SponsoredRestaurantCard } from "@/components/sponsored-restaurant-card";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.isAdvertiser && restaurant.imageUrl) {
    return <SponsoredRestaurantCard restaurant={restaurant} />;
  }

  const town = getTown(restaurant.town);
  return (
    <article className="border border-[#dedfd9] bg-white p-4">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold">{restaurant.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#686e69]">
              <MapPin size={13} /> {town?.name} · {"$".repeat(restaurant.priceLevel)}
            </p>
            <p className="mt-2 truncate text-xs text-[#606660]">{restaurant.cuisines.slice(0, 3).map(titleize).join(" · ")}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-[#355e4b]"><ThumbsUp size={13} /> {restaurant.localVotes.toLocaleString()}</span>
        </div>
      </Link>
    </article>
  );
}
