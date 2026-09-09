import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Clock3,
  ImageIcon,
  MapPin
} from "lucide-react";
import type { Restaurant } from "@/lib/types";
import {
  cuisineLabel,
  getTown
} from "@/lib/constants";

export function RestaurantRow({
  restaurant
}: {
  restaurant: Restaurant;
}) {
  const town = getTown(restaurant.town);

  return (
    <article className="border-t border-[#e0e2dc] first:border-t-0">
      <Link
        href={`/restaurants/${restaurant.slug}`}
        className="group grid gap-3 p-3 transition hover:bg-[#f7f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b52] sm:grid-cols-[138px_minmax(0,1fr)] sm:items-center sm:gap-5 sm:p-4"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#e9ece7] sm:aspect-auto sm:h-[96px]">
          {restaurant.imageUrl ? (
            <Image
              src={restaurant.imageUrl}
              alt={restaurant.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.025]"
              sizes="(max-width: 640px) 100vw, 138px"
            />
          ) : (
            <div className="grid h-full place-items-center text-[#9aa29c]">
              <ImageIcon
                size={25}
                strokeWidth={1.4}
              />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[17px] font-semibold leading-5 text-[#202320] group-hover:underline">
              {restaurant.name}
            </h3>

            {restaurant.openNow === true ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2ea] px-2 py-0.5 text-[10px] font-bold text-[#2d6546]">
                <Clock3 size={11} />
                Open now
              </span>
            ) : null}

            {restaurant.verifiedAt ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#527061]">
                <BadgeCheck size={12} />
                Listing verified
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#5f6861]">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              {town?.name}
            </span>

            <span aria-hidden="true">·</span>

            <span>
              {cuisineLabel(restaurant.cuisine)}
            </span>

            <span aria-hidden="true">·</span>

            <span>
              {"$".repeat(restaurant.priceLevel)}
            </span>
          </p>

          {restaurant.address ? (
            <p className="mt-1 text-[12px] text-[#7a817c]">
              {restaurant.address}
            </p>
          ) : null}

          {restaurant.description ? (
            <p className="mt-2 line-clamp-2 max-w-3xl text-[13px] leading-5 text-[#646c66]">
              {restaurant.description}
            </p>
          ) : null}

          <p className="mt-2 text-[11px] font-medium text-[#7d857f]">
            {restaurant.localVotes.toLocaleString()} local{" "}
            {restaurant.localVotes === 1 ? "vote" : "votes"}
          </p>
        </div>
      </Link>
    </article>
  );
}
