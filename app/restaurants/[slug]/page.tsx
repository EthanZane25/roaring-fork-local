import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import { VotePanel } from "@/components/vote-panel";
import { getCurrentContest, getRestaurant, getRestaurantHours, getRestaurantMenus } from "@/lib/data";
import { cuisineLabel, getTown, titleize } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { RestaurantHour } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function clockLabel(value?: string) {
  if (!value) return "";
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  const date = new Date(2020, 0, 1, hour, minute);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function hoursLabel(hours: RestaurantHour[]) {
  if (!hours.length) return "Closed";
  return hours.map((item) => {
    if (item.note && !item.opensAt && !item.closesAt) return item.note;
    if (!item.opensAt || !item.closesAt) return item.note || "Hours vary";
    const range = `${clockLabel(item.opensAt)} – ${clockLabel(item.closesAt)}`;
    return item.note ? `${range} · ${item.note}` : range;
  }).join(", ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "Restaurant not found" };
  const town = getTown(restaurant.town);
  return { title: `${restaurant.name} — ${town?.name} Restaurant`, description: restaurant.description, alternates: { canonical: `/restaurants/${restaurant.slug}` } };
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  const [contest, hours, menus] = await Promise.all([
    getCurrentContest(),
    getRestaurantHours(restaurant.id),
    getRestaurantMenus(restaurant.id)
  ]);
  const town = getTown(restaurant.town);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.address}`)}`;
  const groupedHours = DAYS.map((day, dayOfWeek) => ({ day, hours: hours.filter((item) => item.dayOfWeek === dayOfWeek) }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    telephone: restaurant.phone,
    url: restaurant.website,
    servesCuisine: cuisineLabel(restaurant.cuisine),
    priceRange: "$".repeat(restaurant.priceLevel),
    geo: restaurant.latitude && restaurant.longitude ? { "@type": "GeoCoordinates", latitude: restaurant.latitude, longitude: restaurant.longitude } : undefined,
    openingHoursSpecification: hours
      .filter((item) => item.opensAt && item.closesAt)
      .map((item) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[item.dayOfWeek]}`,
        opens: item.opensAt,
        closes: item.closesAt
      }))
  };

  return (
    <main className="container-site py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      {restaurant.imageUrl ? (
        <section className="mb-7">
          {restaurant.isAdvertiser ? <p className="mb-2 text-[11px] font-semibold text-[#8a5a31]">Sponsored</p> : null}
          <div className="relative aspect-[16/7] overflow-hidden bg-[#dedfd9]">
            <Image src={restaurant.imageUrl} alt={restaurant.name} fill priority className="object-cover" sizes="100vw" />
          </div>
        </section>
      ) : null}

      <div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[1fr_300px]">
        <article>
          <p className="text-sm font-medium text-[#69706a]">{town?.name} · {cuisineLabel(restaurant.cuisine)}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">{restaurant.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#5e665e]">
            <span className="flex items-center gap-1"><MapPin size={15} /> {restaurant.address}</span>
            <span className="flex items-center gap-1 text-[#2b6144]"><BadgeCheck size={15} /> Verified {formatDate(restaurant.verifiedAt)}</span>
            {restaurant.openNow !== undefined ? (
              <span className={`flex items-center gap-1 font-medium ${restaurant.openNow ? "text-[#2b6144]" : "text-[#7b5549]"}`}>
                <Clock3 size={15} /> {restaurant.openNow ? "Open now" : "Closed now"}
              </span>
            ) : null}
          </div>
          <p className="mt-7 max-w-3xl text-[16px] leading-8 text-[#4f584f]">{restaurant.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {restaurant.tags.map((tag) => <span key={tag} className="border border-[#d8dad4] bg-white px-3 py-1.5 text-xs font-medium">{titleize(tag)}</span>)}
          </div>

          {hours.length ? (
            <section className="mt-10 border-t border-[#dfe1db] pt-7">
              <h2 className="text-xl font-semibold">Hours</h2>
              <div className="mt-4 max-w-2xl border-y border-[#e1e3dd]">
                {groupedHours.map(({ day, hours: dayHours }, index) => (
                  <div key={day} className={`grid grid-cols-[120px_1fr] gap-4 py-3 text-sm ${index ? "border-t border-[#eceee9]" : ""}`}>
                    <span className="font-semibold text-[#4f5751]">{day}</span>
                    <span className="text-[#69706a]">{hoursLabel(dayHours)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {menus.length ? (
            <section className="mt-10 border-t border-[#dfe1db] pt-7">
              <h2 className="text-xl font-semibold">Menus</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {menus.map((menu) => (
                  <a key={menu.id} href={menu.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#cfd2cb] bg-white px-4 py-2.5 text-sm font-semibold text-[#173f30] hover:bg-[#f7f6f2]">
                    {menu.name} <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="h-fit border-l border-[#dfe1db] pl-6">
          <p className="text-sm font-semibold">Price</p>
          <p className="mt-1 text-xl font-semibold">{"$".repeat(restaurant.priceLevel)}</p>
          <p className="mt-5 text-sm font-semibold">Local votes</p>
          <p className="mt-1 text-sm text-[#6e756f]">{restaurant.localVotes.toLocaleString()}</p>

          <div className="mt-6 grid gap-2">
            {restaurant.phone ? <a href={`tel:${restaurant.phone}`} className="flex w-full items-center justify-center gap-2 bg-[#163b2d] px-4 py-3 text-sm font-semibold text-white"><Phone size={16} /> Call restaurant</a> : null}
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 border border-[#cfd2cb] bg-white px-4 py-3 text-sm font-semibold text-[#173f30]"><Navigation size={16} /> Directions</a>
            {restaurant.website ? <a href={restaurant.website} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 border border-[#cfd2cb] bg-white px-4 py-3 text-sm font-semibold text-[#173f30]"><ExternalLink size={16} /> Website</a> : null}
          </div>
          <Link href="/restaurants" className="mt-4 block text-center text-sm font-semibold text-[#315e49] hover:underline">Back to restaurants</Link>
        </aside>
      </div>

      {contest ? <section className="mx-auto mt-12 max-w-3xl"><VotePanel contest={contest} /></section> : null}
    </main>
  );
}
