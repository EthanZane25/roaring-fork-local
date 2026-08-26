import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { getTown, titleize } from "@/lib/constants";

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const town = getTown(restaurant.town);

  return (
    <article className="border-t border-[#e0e2dc] first:border-t-0">
      <Link
        href={`/restaurants/${restaurant.slug}`}
        className="grid gap-2 px-1 py-4 hover:bg-[#f7f6f2] sm:grid-cols-[minmax(0,1.5fr)_minmax(150px,.8fr)_140px_24px] sm:items-center sm:gap-5 sm:px-3"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-[15px] font-semibold text-[#202320]">{restaurant.name}</h3>
            {restaurant.isAdvertiser ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a5a31]">Sponsored</span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[11px] text-[#51705f]">
              <BadgeCheck size={12} /> Verified
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[#686e69]">
            {restaurant.cuisines.slice(0, 3).map(titleize).join(" · ") || "Restaurant"}
            {restaurant.meals.length ? ` · ${restaurant.meals.slice(0, 2).map(titleize).join(" / ")}` : ""}
          </p>
        </div>

        <div className="text-xs text-[#5f6660]">
          <span className="font-medium text-[#343a35]">{town?.name}</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block truncate sm:inline">{restaurant.address}</span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:justify-end">
          <span className="font-medium">{"$".repeat(restaurant.priceLevel)}</span>
          {restaurant.openNow !== undefined ? (
            <span className={restaurant.openNow ? "text-[#2f6649]" : "text-[#8a4d3c]"}>
              {restaurant.openNow ? "Open now" : "Closed"}
            </span>
          ) : null}
        </div>

        <ArrowRight size={15} className="hidden text-[#7c827d] sm:block" />
      </Link>
    </article>
  );
}
