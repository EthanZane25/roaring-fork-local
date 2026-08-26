import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Phone, ThumbsUp } from "lucide-react";
import { getRestaurant } from "@/lib/data";
import { getTown, titleize } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "Restaurant not found" };
  const town = getTown(restaurant.town);
  return {
    title: `${restaurant.name} — ${town?.name} Restaurant`,
    description: restaurant.description,
    alternates: { canonical: `/restaurants/${restaurant.slug}` }
  };
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();
  const town = getTown(restaurant.town);
  const showSponsoredPhoto = restaurant.isAdvertiser && Boolean(restaurant.imageUrl);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    telephone: restaurant.phone,
    servesCuisine: restaurant.cuisines,
    priceRange: "$".repeat(restaurant.priceLevel),
    geo: {
      "@type": "GeoCoordinates",
      latitude: restaurant.latitude,
      longitude: restaurant.longitude
    }
  };

  return (
    <main className="container-site py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      {showSponsoredPhoto ? (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a5a31]">Sponsored restaurant</span>
          </div>
          <div className="relative aspect-[16/7] overflow-hidden bg-[#dedfd9]">
            <Image src={restaurant.imageUrl} alt={restaurant.name} fill priority className="object-cover" sizes="100vw" />
          </div>
        </section>
      ) : null}

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <article className="border border-[#dedfd9] bg-white p-7 sm:p-9">
          <p className="eyebrow">{town?.name} restaurant</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-[-.02em]">{restaurant.name}</h1>
            {restaurant.isAdvertiser ? <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a5a31]">Sponsored</span> : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#5e665e]">
            <span className="flex items-center gap-1"><MapPin size={15} /> {restaurant.address}</span>
            <span className="flex items-center gap-1 text-[#2b6144]"><BadgeCheck size={15} /> Verified {formatDate(restaurant.verifiedAt)}</span>
          </div>
          <p className="mt-7 text-[16px] leading-8 text-[#4f584f]">{restaurant.description}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {[...restaurant.cuisines, ...restaurant.tags].map((tag) => (
              <Link key={tag} href={`/${restaurant.town}/restaurants/${tag}`} className="bg-[#f0efe9] px-3 py-1.5 text-xs font-bold">
                {titleize(tag)}
              </Link>
            ))}
          </div>
        </article>
        <aside className="h-fit border border-[#dedfd9] bg-white p-6">
          <p className="text-sm font-bold text-[#6a726a]">Local votes</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-semibold"><ThumbsUp size={25} className="text-[#b8502f]" /> {restaurant.localVotes.toLocaleString()}</p>
          <Link href="/vote#favorite-restaurant-valley-2026" className="mt-4 block border border-[#cfd2cb] bg-[#f7f6f2] px-4 py-3 text-center text-sm font-semibold text-[#173f30] hover:bg-white">Vote for your favorite restaurant</Link>
          <div className="my-5 h-px bg-[#e1e2dc]" />
          <p className="text-sm font-bold">Price</p>
          <p className="mt-1 text-xl font-semibold">{"$".repeat(restaurant.priceLevel)}</p>
          {restaurant.phone ? <a href={`tel:${restaurant.phone}`} className="mt-5 flex w-full items-center justify-center gap-2 bg-[#163b2d] px-4 py-3 text-sm font-semibold text-white"><Phone size={16} /> Call restaurant</a> : null}
        </aside>
      </div>
    </main>
  );
}
