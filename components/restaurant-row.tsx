import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { cuisineLabel, getTown } from "@/lib/constants";

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const town = getTown(restaurant.town);

  return (
    <article className="border-t border-[#e0e2dc] first:border-t-0">
      <Link
        href={`/restaurants/${restaurant.slug}`}
        className="grid gap-2 px-1 py-4 hover:bg-[#f7f6f2] sm:grid-cols-[minmax(0,1.5fr)_170px_100px_160px_100px] sm:items-center sm:gap-4 sm:px-3"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-semibold leading-5 text-[#202320]">{restaurant.name}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#51705f]"><BadgeCheck size={12} /> Verified</span>
          </div>
        </div>
        <span className="text-[13px] font-medium text-[#4f5751]">{town?.name}</span>
        <span className="text-[13px] text-[#5f6660]">{"$".repeat(restaurant.priceLevel)}</span>
        <span className="text-[13px] text-[#5f6660]">{cuisineLabel(restaurant.cuisine)}</span>
        <span className="text-[13px] text-[#858b86] sm:text-right">{restaurant.localVotes.toLocaleString()} votes</span>
      </Link>
    </article>
  );
}
