import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, ImageIcon, MapPin, ShieldCheck } from "lucide-react";
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
    <main className="container-site py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="relative h-[min(58vh,560px)] min-h-[300px] overflow-hidden rounded-xl bg-[#edf0ec] sm:min-h-[400px]">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          ) : (
            <div className="grid h-full place-items-center text-[#8c9690]">
              <div className="text-center">
                <ImageIcon size={40} className="mx-auto" />
                <p className="mt-2 text-sm font-medium">No photo provided</p>
              </div>
            </div>
          )}
        </div>

        <aside className="card h-fit p-6">
          {listing.status === "held" ? (
            <div className="mb-5 rounded-lg border border-[#decf9d] bg-[#fff9e8] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#674f14]">
                <ShieldCheck size={17} /> Under review
              </p>
              <p className="mt-1 text-xs leading-5 text-[#76632d]">
                Your first listing has been saved but is not public until an administrator approves it.
              </p>
            </div>
          ) : null}

          <p className="eyebrow">{titleize(listing.category)}</p>
          <p className="mt-3 text-3xl font-semibold">{listing.price === 0 ? "Free" : currency(listing.price)}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-.02em]">{listing.title}</h1>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-[#606860]">
            <MapPin size={15} /> {town?.name}
          </p>

          <div className="my-6 h-px bg-[#e0e1da]" />
          <p className="leading-7 text-[#505850]">{listing.description}</p>

          <div className="mt-7 rounded-md bg-[#f0efe9] p-4">
            <p className="font-semibold">{listing.sellerName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#4d6957]">
              {listing.sellerVerified ? <><BadgeCheck size={14} /> Verified seller</> : "Local seller"}
            </p>
          </div>

          {listing.status === "active" ? <MessageSellerButton listingId={listing.id} /> : null}
        </aside>
      </div>
    </main>
  );
}
