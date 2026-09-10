import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  ImageIcon,
  MapPin
} from "lucide-react";

import type { Restaurant } from "@/lib/types";
import { cuisineLabel, getTown } from "@/lib/constants";
import { formatDistanceMiles } from "@/lib/geo";

export function RestaurantRow({
  restaurant,
  distance
}: {
  restaurant: Restaurant;
  distance?: number;
}) {
  const town = getTown(restaurant.town);

  const priceVerified =
    !restaurant.tags.includes("price-unverified");

  return (
    <article className="border-t border-[#e1e4df] first:border-t-0">
      <Link
        href={`/restaurants/${restaurant.slug}`}
        className="group grid gap-4 p-4 transition hover:bg-[#f8f7f3] sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5 sm:p-5"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eceeea]">
          {restaurant.imageUrl ? (
            <Image
              src={restaurant.imageUrl}
              alt={`${restaurant.name}${town ? ` in ${town.name}` : ""}`}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.025]"
              sizes="(max-width: 640px) 100vw, 190px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#8b938d]">
              <ImageIcon size={27} strokeWidth={1.35} />
              <span className="text-[11px] font-medium">
                Photo coming soon
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[19px] font-semibold leading-6 tracking-[-.015em] text-[#202420] group-hover:underline">
              {restaurant.name}
            </h3>

            {restaurant.isAdvertiser ? (
              <span className="rounded-full bg-[#f6eed8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#795e19]">
                Featured
              </span>
            ) : null}

            {restaurant.openNow === true ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f2e9] px-2.5 py-1 text-[10px] font-bold text-[#2d6546]">
                <Clock3 size={11} />
                Open now
              </span>
            ) : null}

            {restaurant.verifiedAt ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#527061]">
                <BadgeCheck size={12} />
                Verified
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#606962]">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {town?.name}
            </span>

            <span>·</span>

            <span>{cuisineLabel(restaurant.cuisine)}</span>

            {priceVerified && restaurant.priceLevel > 0 ? (
              <>
                <span>·</span>
                <span>{"$".repeat(restaurant.priceLevel)}</span>
              </>
            ) : null}

            {distance !== undefined && Number.isFinite(distance) ? (
              <>
                <span>·</span>
                <span className="font-semibold text-[#315e49]">
                  {formatDistanceMiles(distance)}
                </span>
              </>
            ) : null}
          </div>

          {restaurant.address ? (
            <p className="mt-2 text-[12px] text-[#7a817c]">
              {restaurant.address}
            </p>
          ) : null}

          {restaurant.description ? (
            <p className="mt-3 line-clamp-2 max-w-3xl text-[13px] leading-5 text-[#646c66]">
              {restaurant.description}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-4 pt-4">
            {restaurant.localVotes > 0 ? (
              <span className="text-[11px] font-medium text-[#7d857f]">
                {restaurant.localVotes.toLocaleString()} local{" "}
                {restaurant.localVotes === 1 ? "vote" : "votes"}
              </span>
            ) : (
              <span />
            )}

            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#173f30]">
              View details
              <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
