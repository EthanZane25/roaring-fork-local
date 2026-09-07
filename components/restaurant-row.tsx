import Link from "next/link";
import { BadgeCheck, Clock3, MapPin } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { cuisineLabel, getTown } from "@/lib/constants";

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const town = getTown(restaurant.town);

  return (
    <article className="border-t border-[#e0e2dc] first:border-t-0">
      <Link
        href={`/restaurants/${restaurant.slug}`}
        className="grid min-h-16 gap-2 px-3 py-4 hover:bg-[#f7f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b52] sm:grid-cols-[minmax(0,1.5fr)_150px_85px_150px_120px] sm:items-center sm:gap-4"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-semibold leading-5 text-[#202320]">{restaurant.name}</h3>
            {restaurant.verifiedAt ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#51705f]">
                <BadgeCheck size={12} /> Verified
              </span>
            ) : null}
            {restaurant.openNow === true ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2ea] px-2 py-0.5 text-[10px] font-bold text-[#2d6546]">
                <Clock3 size={11} /> Open now
              </span>
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-[#7a817c] sm:hidden">
            <MapPin size={11} /> {town?.name}
          </p>
        </div>
        <span className="hidden text-[13px] font-medium text-[#4f5751] sm:block">{town?.name}</span>
        <span className="text-[13px] text-[#5f6660]">{"$".repeat(restaurant.priceLevel)}</span>
        <span className="text-[13px] text-[#5f6660]">{cuisineLabel(restaurant.cuisine)}</span>
        <span className="text-[13px] text-[#858b86] sm:text-right">{restaurant.localVotes.toLocaleString()} votes</span>
      </Link>
    </article>
  );
}
