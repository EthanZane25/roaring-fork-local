import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  ImageIcon,
  MapPin
} from "lucide-react";
import type { MarketplaceListing } from "@/lib/types";
import { currency } from "@/lib/utils";
import {
  getTown,
  titleize
} from "@/lib/constants";

function age(value: string) {
  const delta = Math.max(
    0,
    Date.now() - new Date(value).getTime()
  );

  const days = Math.floor(
    delta / 86400000
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function ListingCard({
  listing
}: {
  listing: MarketplaceListing;
}) {
  const town = getTown(listing.town);
  const external =
    listing.sourceType === "external";

  return (
    <article className="h-full overflow-hidden rounded-xl border border-[#dde2dc] bg-white transition hover:border-[#c3ccc5] hover:shadow-[0_5px_18px_rgba(22,38,29,0.08)]">
      <Link
        href={`/marketplace/${listing.slug}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#edf0ec]">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="grid h-full place-items-center text-[#9aa29c]">
              <ImageIcon size={30} />
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#4e5851]">
            {titleize(listing.category)}
          </span>

          {external ? (
            <span className="absolute bottom-3 left-3 rounded-md bg-[#173f30]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              External · {listing.sourceName || "Source"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-[20px] font-semibold tracking-[-0.025em]">
            {listing.price === 0
              ? "Free"
              : currency(listing.price)}
          </p>

          <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-5">
            {listing.title}
          </h3>

          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#69716b]">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {town?.name}
              </span>

              <span>{age(listing.createdAt)}</span>
            </div>

            {!external && listing.sellerVerified ? (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#527061]">
                <BadgeCheck size={13} />
                Verified seller
              </p>
            ) : null}

            {external ? (
              <p className="mt-2 text-[11px] font-semibold text-[#687169]">
                View original listing for current availability
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
