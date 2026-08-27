import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { MarketplaceListing } from "@/lib/types";
import { currency } from "@/lib/utils";
import { getTown } from "@/lib/constants";

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const town = getTown(listing.town);

  return (
    <article className="h-full overflow-hidden border border-[#dedfd9] bg-white">
      <Link href={`/marketplace/${listing.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e7e7e2]">
          <Image src={listing.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[18px] font-semibold tracking-[-0.01em]">{currency(listing.price)}</p>
          <h3 className="mt-1 text-[16px] font-medium leading-5">{listing.title}</h3>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-[13px] text-[#6b716c]">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {town?.name}</span>
            {listing.sellerVerified ? <span className="inline-flex items-center gap-1 text-[#51705f]"><BadgeCheck size={13} /> Verified</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
