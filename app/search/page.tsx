import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { RestaurantRow } from "@/components/restaurant-row";
import { getEvents, getHousing, getJobs, getListings, getRestaurants } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { currency } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true }
};

type SearchTab = "all" | "eat" | "marketplace" | "events";

const TABS: Array<[string, SearchTab]> = [
  ["All", "all"],
  ["Eat", "eat"],
  ["Marketplace", "marketplace"],
  ["Events", "events"]
];

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

function tabHref(q: string, town: string | undefined, tab: SearchTab) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (town) params.set("town", town);
  if (tab !== "all") params.set("tab", tab);
  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; town?: string; tab?: string }>;
}) {
  const { q = "", town, tab = "all" } = await searchParams;
  const activeTab: SearchTab = ["eat", "marketplace", "events"].includes(tab) ? tab as SearchTab : "all";
  const normalized = q.trim().toLowerCase();
  const liveInventory = hasSupabaseEnv();

  const [restaurants, listings, events, jobs, housing] = await Promise.all([
    getRestaurants({ town }),
    getListings({ town }),
    getEvents({ town }),
    liveInventory ? getJobs({ town }) : Promise.resolve([]),
    liveInventory ? getHousing({ town }) : Promise.resolve([])
  ]);

  const restaurantMatches = normalized
    ? restaurants.filter((restaurant) => [restaurant.name, restaurant.description, restaurant.town, restaurant.cuisine, ...restaurant.cuisines, ...restaurant.tags].join(" ").toLowerCase().includes(normalized))
    : [];
  const listingMatches = normalized
    ? listings.filter((listing) => [listing.title, listing.description, listing.town, listing.category].join(" ").toLowerCase().includes(normalized))
    : [];
  const eventMatches = normalized
    ? events.filter((event) => [event.title, event.venue, event.town, event.category].join(" ").toLowerCase().includes(normalized))
    : [];
  const jobMatches = normalized
    ? jobs.filter((job) => [job.title, job.company, job.town, job.pay, job.type].join(" ").toLowerCase().includes(normalized))
    : [];
  const housingMatches = normalized
    ? housing.filter((listing) => [listing.title, listing.town, listing.type, String(listing.bedrooms), String(listing.price)].join(" ").toLowerCase().includes(normalized))
    : [];

  const totalMatches = restaurantMatches.length + listingMatches.length + eventMatches.length + jobMatches.length + housingMatches.length;
  const townName = town ? getTown(town)?.name : undefined;

  return (
    <main className="container-site py-10 sm:py-12">
      <p className="eyebrow">Find it locally</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.03em]">Search the valley</h1>

      <form className="mt-6 flex max-w-2xl gap-2">
        <input name="q" defaultValue={q} className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#d6d8d1] bg-white px-4 py-3" placeholder="Try tacos, ski, open mic…" />
        {town ? <input type="hidden" name="town" value={town} /> : null}
        <button className="min-h-11 rounded-lg bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white">Search</button>
      </form>

      {townName ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#667069]">
          <span className="rounded-full border border-[#d5d9d4] bg-white px-3 py-1.5">Searching in {townName}</span>
          <Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className="font-semibold text-[#173f30] hover:underline">Search whole valley</Link>
        </div>
      ) : null}

      <div className="mt-7 flex gap-1 border-b border-[#d9ddd8]" role="tablist" aria-label="Search result types">
        {TABS.map(([label, value]) => {
          const active = activeTab === value;
          return (
            <Link
              key={value}
              href={tabHref(q, town, value)}
              role="tab"
              aria-selected={active}
              className={`min-h-11 border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-[#173f30] text-[#173f30]" : "border-transparent text-[#677069] hover:text-[#173f30]"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {!normalized ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#cdd2cd] bg-white p-7">
          <p className="font-semibold">Search for something useful.</p>
          <p className="mt-2 text-sm text-[#69716b]">Try “tacos”, “ski”, “Honda”, “open mic”, or a local business name.</p>
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm text-[#6d756f]">{totalMatches.toLocaleString()} matches across the local directory.</p>

          {(activeTab === "all" || activeTab === "eat") ? (
            <section className="mt-8">
              <h2 className="text-2xl font-semibold">Eat <span className="text-[#7a827a]">({restaurantMatches.length})</span></h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-[#d9dbd5] bg-white">
                {restaurantMatches.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
                {!restaurantMatches.length ? <p className="p-5 text-sm text-[#686f69]">No restaurant matches. Try a cuisine or nearby town.</p> : null}
              </div>
            </section>
          ) : null}

          {(activeTab === "all" || activeTab === "marketplace") ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Marketplace <span className="text-[#7a827a]">({listingMatches.length})</span></h2>
              {listingMatches.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listingMatches.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <p className="mt-4 text-sm text-[#686f69]">No marketplace matches.</p>}
            </section>
          ) : null}

          {(activeTab === "all" || activeTab === "events") ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Events <span className="text-[#7a827a]">({eventMatches.length})</span></h2>
              <div className="mt-4 border-y border-[#d9dbd5] bg-white">
                {eventMatches.map((event, index) => (
                  <div key={event.id} className={`grid min-h-16 gap-1 py-4 sm:grid-cols-[160px_1fr_180px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
                    <span className="text-[13px] font-semibold text-[#667068]">{getTown(event.town)?.name}</span>
                    <div><h3 className="text-[16px] font-semibold">{event.title}</h3><p className="mt-1 text-[13px] text-[#737a74]">{event.venue}</p></div>
                    <time dateTime={event.startsAt} className="text-[13px] text-[#5f665f] sm:text-right">{eventTime(event.startsAt)}</time>
                  </div>
                ))}
                {!eventMatches.length ? <p className="py-5 text-sm text-[#686f69]">No event matches.</p> : null}
              </div>
            </section>
          ) : null}

          {activeTab === "all" && (jobMatches.length || housingMatches.length) ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">More local results</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {jobMatches.length ? (
                  <div className="rounded-xl border border-[#d9dbd5] bg-white p-5">
                    <h3 className="font-semibold">Jobs ({jobMatches.length})</h3>
                    <div className="mt-3 space-y-3">{jobMatches.slice(0, 4).map((job) => <div key={job.id}><p className="text-sm font-semibold">{job.title}</p><p className="text-xs text-[#737a74]">{job.company} · {job.pay}</p></div>)}</div>
                    <Link href={town ? `/jobs?town=${encodeURIComponent(town)}` : "/jobs"} className="mt-4 inline-flex text-sm font-semibold text-[#173f30]">View jobs →</Link>
                  </div>
                ) : null}
                {housingMatches.length ? (
                  <div className="rounded-xl border border-[#d9dbd5] bg-white p-5">
                    <h3 className="font-semibold">Housing ({housingMatches.length})</h3>
                    <div className="mt-3 space-y-3">{housingMatches.slice(0, 4).map((item) => <div key={item.id}><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[#737a74]">{getTown(item.town)?.name} · {currency(item.price)} / mo</p></div>)}</div>
                    <Link href={town ? `/housing?town=${encodeURIComponent(town)}` : "/housing"} className="mt-4 inline-flex text-sm font-semibold text-[#173f30]">View housing →</Link>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
