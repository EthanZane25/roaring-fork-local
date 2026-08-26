import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { MarketplaceListing } from "@/lib/types";
import { currency } from "@/lib/utils";
import { getTown } from "@/lib/constants";

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const town = getTown(listing.town);
  return (
    <article className="card overflow-hidden">
      <Link href={`/marketplace/${listing.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e4e4de]">
          <Image src={listing.imageUrl} alt="" fill className="object-cover transition duration-500 hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 25vw" />
        </div>
        <div className="p-4">
          <p className="text-lg font-black">{currency(listing.price)}</p>
          <h3 className="mt-1 line-clamp-1 font-bold">{listing.title}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-[#666e66]"><MapPin size={13} /> {town?.name}</p>
          <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#4d554e]">
            {listing.sellerVerified ? <><BadgeCheck size={14} className="text-[#2a6849]" /> Verified seller</> : <>Local seller</>}
          </p>
        </div>
      </Link>
    </article>
  );
}
