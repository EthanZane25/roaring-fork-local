import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, ShoppingBag, UtensilsCrossed, Vote } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { getCurrentContest, getEvents, getListings, getRestaurants } from "@/lib/data";
import { cuisineLabel, getTown } from "@/lib/constants";

function withTown(path: string, town?: string) {
  if (!town) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}town=${encodeURIComponent(town)}`;
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ town?: string }>;
}) {
  const { town } = await searchParams;

  const [openRestaurants, tonight, listings, contest] = await Promise.all([
    getRestaurants({ town, category: "open-now", limit: 8 }),
    getEvents({ town, limit: 4, todayOnly: true }),
    getListings({ town, limit: 3 }),
    getCurrentContest()
  ]);

  const townName = town ? getTown(town)?.name : undefined;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#d8d5cc] bg-[#173f30]">
        <Image
          src="/roaring-fork-valley-hero.jpg"
          alt="Roaring Fork Valley"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,24,17,.57),rgba(12,24,17,.24)_58%,rgba(12,24,17,.08))]" />
        <div className="container-site relative z-10 flex min-h-[330px] items-end py-9 sm:min-h-[370px] sm:py-11">
          <div className="max-w-3xl">
            <p className="text-[12px] font-bold uppercase tracking-[.16em] text-white/78">
              {townName ? `${townName} · Roaring Fork Valley` : "Aspen to Rifle"}
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-[44px] leading-[1.02] tracking-[-.035em] text-white sm:text-[58px]">
              Aspen to Rifle — eat, buy, go out.
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-white/90">
              What is open, what is happening tonight, and what locals just listed nearby.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={withTown("/restaurants?open=1", town)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#173f30]">
                <UtensilsCrossed size={16} /> Open now
              </Link>
              <Link href={withTown("/events", town)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-black/10 px-4 text-sm font-semibold text-white backdrop-blur-sm">
                <CalendarDays size={16} /> Tonight
              </Link>
              <Link href={withTown("/marketplace", town)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-black/10 px-4 text-sm font-semibold text-white backdrop-blur-sm">
                <ShoppingBag size={16} /> New listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Eat now</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">
              {townName ? `Open in ${townName}` : "Open across the valley"}
            </h2>
          </div>
          <Link href={withTown("/restaurants?open=1", town)} className="hidden text-sm font-semibold text-[#173f30] hover:underline sm:inline">
            Find food <ArrowRight size={14} className="ml-1 inline" />
          </Link>
        </div>

        {openRestaurants.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {openRestaurants.slice(0, 4).map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.slug}`} className="group rounded-xl border border-[#dde1dc] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[17px] font-semibold leading-5">{restaurant.name}</h3>
                    <p className="mt-2 flex items-center gap-1 text-[12px] text-[#6a736c]">
                      <MapPin size={12} /> {getTown(restaurant.town)?.name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e8f2ea] px-2.5 py-1 text-[11px] font-bold text-[#2d6546]">Open</span>
                </div>
                <p className="mt-4 text-[13px] text-[#5f6861]">
                  {cuisineLabel(restaurant.cuisine)} · {"$".repeat(restaurant.priceLevel)}
                </p>
                <p className="mt-2 text-[12px] text-[#7d847f]">{restaurant.localVotes.toLocaleString()} local votes</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[#cdd2cd] bg-white p-7">
            <p className="font-semibold">No restaurants are marked open right now{townName ? ` in ${townName}` : ""}.</p>
            <p className="mt-2 text-sm text-[#69716b]">Browse the full restaurant guide for hours and nearby options.</p>
            <Link href={withTown("/restaurants", town)} className="mt-4 inline-flex text-sm font-semibold text-[#173f30] hover:underline">Browse restaurants →</Link>
          </div>
        )}
      </section>

      <section className="border-y border-[#dedfd9] bg-white">
        <div className="container-site grid gap-10 py-10 lg:grid-cols-[1.15fr_.85fr] lg:py-12">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Tonight</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">What’s happening</h2>
              </div>
              <Link href={withTown("/events", town)} className="text-sm font-semibold text-[#173f30] hover:underline">All events →</Link>
            </div>

            {tonight.length ? (
              <div className="mt-5 border-y border-[#e1e3dd]">
                {tonight.map((event, index) => (
                  <Link
                    key={event.id}
                    href={withTown("/events", town)}
                    className={`grid min-h-16 gap-2 py-4 sm:grid-cols-[90px_1fr_120px] sm:items-center ${index ? "border-t border-[#eceee9]" : ""}`}
                  >
                    <time dateTime={event.startsAt} className="text-sm font-semibold text-[#173f30]">{eventTime(event.startsAt)}</time>
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="mt-1 text-xs text-[#6f7771]">{event.venue}</p>
                    </div>
                    <span className="text-xs text-[#747c76] sm:text-right">{getTown(event.town)?.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#cdd2cd] bg-[#fbfcfa] p-7">
                <p className="font-semibold">Nothing is listed for tonight{townName ? ` in ${townName}` : ""}.</p>
                <p className="mt-2 text-sm text-[#69716b]">
                  {townName ? "Check another nearby town or the full events calendar." : "Check the full calendar for upcoming local events."}
                </p>
              </div>
            )}
          </div>

          <div>
            <div>
              <p className="eyebrow">Community voice</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Vote local</h2>
            </div>
            {contest ? (
              <Link href={`/vote#${contest.slug}`} className="mt-5 block rounded-xl border border-[#d7ddd8] bg-[#f7f5ee] p-6 transition hover:bg-[#f2efe6]">
                <Vote size={24} className="text-[#173f30]" />
                <h3 className="mt-4 text-xl font-semibold">{contest.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#657069]">See live results, choose a restaurant, and verify once to lock your vote.</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#173f30]">See contest <ArrowRight size={14} className="ml-1" /></span>
              </Link>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#cdd2cd] p-6">
                <p className="font-semibold">No local contest is open right now.</p>
                <p className="mt-2 text-sm text-[#69716b]">Current and past voting will appear here when a contest is live.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Marketplace</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Newest nearby</h2>
          </div>
          <Link href={withTown("/marketplace", town)} className="text-sm font-semibold text-[#173f30] hover:underline">Browse all →</Link>
        </div>

        {listings.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[#cdd2cd] bg-white p-7">
            <p className="font-semibold">No fresh listings{townName ? ` in ${townName}` : ""} yet.</p>
            <p className="mt-2 text-sm text-[#69716b]">Post something local or search the whole valley.</p>
            <Link href="/marketplace/new" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#173f30] px-4 text-sm font-semibold text-white">Post a listing</Link>
          </div>
        )}
      </section>
    </main>
  );
}
