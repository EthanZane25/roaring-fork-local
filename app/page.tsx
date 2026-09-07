import Image from "next/image";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { RoaringForkMountains } from "@/components/roaring-fork-mountains";
import { getEvents, getListings, getRestaurants } from "@/lib/data";
import { CUISINES, cuisineLabel, getTown } from "@/lib/constants";

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

function withTown(path: string, town?: string) {
  if (!town) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}town=${encodeURIComponent(town)}`;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const [events, listings, sponsors] = await Promise.all([
    getEvents({ town, limit: 3, todayOnly: true }),
    getListings({ town, limit: 3 }),
    getRestaurants({ town, advertiserOnly: true, limit: 3 })
  ]);

  const cuisineLinks = CUISINES.filter((item) => item.value);

  return (
    <main>
      <section className="bg-white">
        <div className="container-site grid min-h-[360px] items-center gap-10 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-18">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-5xl font-semibold leading-[0.94] tracking-[-0.045em] text-[#173f30] sm:text-6xl lg:text-7xl">
              Local life,<br />all in one place.
            </h1>
            <div className="mt-7 h-[2px] w-16 bg-[#b54d2f]" />
            <p className="mt-6 max-w-xl text-[17px] leading-7 text-[#5f665f] sm:text-lg">
              Food, classifieds, jobs, housing, and local votes from Aspen to Rifle.
            </p>
          </div>

          <div className="hidden h-[300px] text-[#668977] lg:block">
            <RoaringForkMountains />
          </div>
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#d6d8d2] pb-3">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Tonight</h2>
          <Link href={withTown("/events", town)} className="text-sm font-semibold text-[#315e49] hover:underline">See all events →</Link>
        </div>
        <div className="bg-white">
          {events.map((event, index) => (
            <Link
              key={event.id}
              href={withTown("/events", town)}
              className={`grid gap-2 py-4 hover:bg-[#f7f6f2] sm:grid-cols-[160px_1fr_120px] sm:items-center ${index ? "border-t border-[#e2e3de]" : ""}`}
            >
              <span className="text-[13px] font-semibold text-[#6a706b]">{getTown(event.town)?.name}</span>
              <strong className="text-[16px] font-semibold">{event.title}</strong>
              <span className="text-[13px] text-[#5f665f] sm:text-right">{eventTime(event.startsAt)}</span>
            </Link>
          ))}
          {!events.length ? <p className="py-5 text-sm text-[#666d67]">No events are listed for this town tonight yet.</p> : null}
        </div>
      </section>

      <section className="container-site pb-10 sm:pb-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#d6d8d2] pb-3">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Eat by cuisine</h2>
          <Link href={withTown("/restaurants", town)} className="text-sm font-semibold text-[#315e49] hover:underline">All restaurants →</Link>
        </div>
        <div className="grid grid-cols-2 border-b border-l border-[#dedfd9] sm:grid-cols-3 lg:grid-cols-6">
          {cuisineLinks.map((cuisine) => (
            <Link
              key={cuisine.value}
              href={withTown(`/restaurants?cuisine=${cuisine.value}`, town)}
              className="border-r border-t border-[#dedfd9] bg-white px-4 py-5 text-center text-sm font-semibold hover:bg-[#f7f6f2]"
            >
              {cuisine.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site pb-12 sm:pb-16">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#d6d8d2] pb-3">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">New in Marketplace</h2>
          <Link href={withTown("/marketplace", town)} className="text-sm font-semibold text-[#315e49] hover:underline">See all listings →</Link>
        </div>
        {listings.length ? (
          <div className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <p className="py-5 text-sm text-[#666d67]">No marketplace listings are active for this town yet.</p>
        )}
      </section>

      {sponsors.length ? (
        <section className="container-site pb-12 sm:pb-16">
          <div className="flex items-baseline justify-between gap-4 border-b border-[#d6d8d2] pb-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Sponsored</h2>
            <span className="text-[12px] text-[#777d78]">Paid advertising</span>
          </div>
          <div className="grid gap-4 pt-5 md:grid-cols-3">
            {sponsors.map((restaurant) => (
              <article key={restaurant.id} className="border border-[#dedfd9] bg-white">
                <Link href={`/restaurants/${restaurant.slug}`} className="block">
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#ecece7]">
                    {restaurant.imageUrl ? (
                      <Image
                        src={restaurant.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a5a31]">Sponsored</span>
                    <h3 className="mt-1 text-[17px] font-semibold leading-5">{restaurant.name}</h3>
                    <p className="mt-2 text-[13px] text-[#666d67]">
                      {getTown(restaurant.town)?.name} · {cuisineLabel(restaurant.cuisine)} · {"$".repeat(restaurant.priceLevel)}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-[#d8dad4] bg-[#f1efe8]">
        <div className="container-site flex flex-col gap-5 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b716c]">One local account</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">One account for the whole corridor.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f665f]">Post marketplace listings, verify your phone once, and take part in local votes from Aspen through Rifle.</p>
          </div>
          <Link href="/account" className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#204c3a]">
            Create or sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
