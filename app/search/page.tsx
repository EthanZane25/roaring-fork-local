import type { Metadata } from "next";
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

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; town?: string }> }) {
  const { q = "", town } = await searchParams;
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

  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em]">Search</h1>
      <form className="mt-7 flex max-w-2xl gap-2">
        <input name="q" defaultValue={q} className="min-w-0 flex-1 border border-[#d6d8d1] bg-white px-4 py-3" placeholder="Restaurant, bike, event, job, housing…" />
        {town ? <input type="hidden" name="town" value={town} /> : null}
        <button className="bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white">Search</button>
      </form>
      {town ? <p className="mt-3 text-sm text-[#707771]">Showing results in {getTown(town)?.name || "the selected town"}.</p> : null}
      {normalized ? <p className="mt-3 text-xs text-[#7a817b]">{totalMatches.toLocaleString()} total matches across the local directory.</p> : null}

      {normalized ? (
        <>
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Restaurants <span className="text-[#7a827a]">({restaurantMatches.length})</span></h2>
            <div className="mt-4 border-y border-[#d9dbd5] bg-white">
              {restaurantMatches.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
              {!restaurantMatches.length ? <p className="py-5 text-sm text-[#686f69]">No restaurant matches.</p> : null}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Marketplace <span className="text-[#7a827a]">({listingMatches.length})</span></h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{listingMatches.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
            {!listingMatches.length ? <p className="mt-4 text-sm text-[#686f69]">No marketplace matches.</p> : null}
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Events <span className="text-[#7a827a]">({eventMatches.length})</span></h2>
            <div className="mt-4 border-y border-[#d9dbd5] bg-white">
              {eventMatches.map((event, index) => (
                <div key={event.id} className={`grid gap-1 py-4 sm:grid-cols-[160px_1fr_180px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
                  <span className="text-[13px] font-semibold text-[#667068]">{getTown(event.town)?.name}</span>
                  <div>
                    <h3 className="text-[16px] font-semibold">{event.title}</h3>
                    <p className="mt-1 text-[13px] text-[#737a74]">{event.venue}</p>
                  </div>
                  <time dateTime={event.startsAt} className="text-[13px] text-[#5f665f] sm:text-right">{eventTime(event.startsAt)}</time>
                </div>
              ))}
              {!eventMatches.length ? <p className="py-5 text-sm text-[#686f69]">No event matches.</p> : null}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Jobs <span className="text-[#7a827a]">({jobMatches.length})</span></h2>
            <div className="mt-4 border-y border-[#d9dbd5] bg-white">
              {jobMatches.map((job, index) => (
                <div key={job.id} className={`grid gap-1 py-4 sm:grid-cols-[160px_1fr_180px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
                  <span className="text-[13px] font-semibold text-[#667068]">{getTown(job.town)?.name}</span>
                  <div>
                    <h3 className="text-[16px] font-semibold">{job.title}</h3>
                    <p className="mt-1 text-[13px] text-[#737a74]">{job.company} · {job.type}</p>
                  </div>
                  <span className="text-[13px] text-[#5f665f] sm:text-right">{job.pay}</span>
                </div>
              ))}
              {!jobMatches.length ? <p className="py-5 text-sm text-[#686f69]">No job matches.</p> : null}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Housing <span className="text-[#7a827a]">({housingMatches.length})</span></h2>
            <div className="mt-4 border-y border-[#d9dbd5] bg-white">
              {housingMatches.map((listing, index) => (
                <div key={listing.id} className={`grid gap-1 py-4 sm:grid-cols-[160px_1fr_180px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
                  <span className="text-[13px] font-semibold text-[#667068]">{getTown(listing.town)?.name}</span>
                  <div>
                    <h3 className="text-[16px] font-semibold">{listing.title}</h3>
                    <p className="mt-1 text-[13px] text-[#737a74]">{listing.type} · {listing.bedrooms || "Studio"} bedrooms</p>
                  </div>
                  <span className="text-[13px] text-[#5f665f] sm:text-right">{currency(listing.price)} / mo</span>
                </div>
              ))}
              {!housingMatches.length ? <p className="py-5 text-sm text-[#686f69]">No housing matches.</p> : null}
            </div>
          </section>
        </>
      ) : <p className="mt-8 text-[#626a62]">Enter a search above.</p>}
    </main>
  );
}
