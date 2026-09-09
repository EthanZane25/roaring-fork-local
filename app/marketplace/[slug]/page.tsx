import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ExternalLink,
  MapPin,
  ShieldCheck
} from "lucide-react";
import { ListingGallery } from "@/components/listing-gallery";
import { MessageSellerButton } from "@/components/message-seller-button";
import {
  getListing,
  getListingImages
} from "@/lib/data";
import { currency } from "@/lib/utils";
import {
  getTown,
  titleize
} from "@/lib/constants";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    return {
      title: "Listing not found"
    };
  }

  const town =
    getTown(listing.town)?.name ||
    "Roaring Fork Valley";

  return {
    title: `${listing.title} for ${currency(
      listing.price
    )}`,
    description: listing.sourceType === "external"
      ? `${listing.title} — external listing available near ${town}.`
      : `${listing.description.slice(
          0,
          150
        )} — local pickup in ${town}.`,
    alternates: {
      canonical: `/marketplace/${listing.slug}`
    }
  };
}

export default async function MarketplaceListingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    notFound();
  }

  const town = getTown(listing.town);

  const storedImages =
    await getListingImages(listing.id);

  const images = [
    ...new Set(
      [
        listing.imageUrl,
        ...storedImages
      ].filter(Boolean)
    )
  ] as string[];

  const external =
    listing.sourceType === "external";

  return (
    <main className="container-site py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
        <ListingGallery
          images={images}
          title={listing.title}
        />

        <aside className="card h-fit p-6">
          {listing.status === "held" ? (
            <div className="mb-5 rounded-lg border border-[#decf9d] bg-[#fff9e8] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#674f14]">
                <ShieldCheck size={17} />
                Under review
              </p>

              <p className="mt-1 text-xs leading-5 text-[#76632d]">
                Your first listing has been saved but is
                not public until an administrator approves it.
              </p>
            </div>
          ) : null}

          {external ? (
            <p className="mb-4 inline-flex rounded-md bg-[#eef1ed] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-[#536057]">
              External listing · {listing.sourceName}
            </p>
          ) : null}

          <p className="eyebrow">
            {titleize(listing.category)}
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {listing.price === 0
              ? "Free"
              : currency(listing.price)}
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-.02em]">
            {listing.title}
          </h1>

          <p className="mt-4 flex items-center gap-1.5 text-sm text-[#606860]">
            <MapPin size={15} />
            {town?.name}
          </p>

          {listing.locationNote ? (
            <p className="mt-1 text-xs text-[#7a817b]">
              {listing.locationNote}
            </p>
          ) : null}

          {listing.condition ? (
            <p className="mt-4 text-sm">
              <span className="font-semibold">
                Condition:
              </span>{" "}
              {listing.condition}
            </p>
          ) : null}

          <div className="my-6 h-px bg-[#e0e1da]" />

          <p className="leading-7 text-[#505850]">
            {listing.description}
          </p>

          {external ? (
            <>
              <div className="mt-7 rounded-md bg-[#f0efe9] p-4">
                <p className="font-semibold">
                  External seller
                </p>

                <p className="mt-1 text-xs leading-5 text-[#687169]">
                  This item was found through{" "}
                  {listing.sourceName}. Roaring Fork Local
                  is not the seller.
                </p>
              </div>

              {listing.sourceUrl ? (
                <a
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white"
                >
                  View original listing
                  <ExternalLink size={16} />
                </a>
              ) : null}

              <p className="mt-3 text-xs leading-5 text-[#7a817b]">
                Price and availability can change on the
                source site.
              </p>
            </>
          ) : (
            <>
              <div className="mt-7 rounded-md bg-[#f0efe9] p-4">
                <p className="font-semibold">
                  {listing.sellerName}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#4d6957]">
                  {listing.sellerVerified ? (
                    <>
                      <BadgeCheck size={14} />
                      Verified seller
                    </>
                  ) : (
                    "Local seller"
                  )}
                </p>
              </div>

              {listing.status === "active" ? (
                <MessageSellerButton
                  listingId={listing.id}
                />
              ) : null}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
