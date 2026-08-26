import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin } from "lucide-react";
import { MessageSellerButton } from "@/components/message-seller-button";
import { getListing } from "@/lib/data";
import { currency } from "@/lib/utils";
import { getTown, titleize } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.title} for ${currency(listing.price)}`,
    description: `${listing.description.slice(0, 150)} — local pickup in ${getTown(listing.town)?.name}.`,
    alternates: { canonical: `/marketplace/${listing.slug}` }
  };
}

export default async function MarketplaceListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();
  const town = getTown(listing.town);

  return (
    <main className="container-site py-10">
      <div className="grid gap-7 lg:grid-cols-[1.45fr_.75fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#dedfd9]">
          <Image src={listing.imageUrl} alt={listing.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 65vw" />
        </div>
        <aside className="card h-fit p-7">
          <p className="eyebrow">{titleize(listing.category)}</p>
          <p className="mt-3 text-3xl font-black">{currency(listing.price)}</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-.03em]">{listing.title}</h1>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-[#606860]"><MapPin size={15} /> {town?.name}</p>
          <div className="my-6 h-px bg-[#e0e1da]" />
          <p className="leading-7 text-[#505850]">{listing.description}</p>
          <div className="mt-7 rounded-2xl bg-[#f0efe9] p-4">
            <p className="font-black">{listing.sellerName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#4d6957]">
              {listing.sellerVerified ? <><BadgeCheck size={14} /> Verified seller</> : "Local seller"}
            </p>
          </div>
          <MessageSellerButton listingId={listing.id} />
        </aside>
      </div>
    </main>
  );
}
