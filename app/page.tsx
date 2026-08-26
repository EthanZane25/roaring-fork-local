import Link from "next/link";
import { ArrowRight, CalendarDays, Home, MapPinned, ShoppingBag, Trophy, UtensilsCrossed, BriefcaseBusiness } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { TownStrip } from "@/components/town-strip";
import { SectionHeading } from "@/components/section-heading";
import { RestaurantCard } from "@/components/restaurant-card";
import { ListingCard } from "@/components/listing-card";
import { VotePanel } from "@/components/vote-panel";
import { getEvents, getListings, getPolls, getRestaurants } from "@/lib/data";
import { getTown } from "@/lib/constants";

const sections = [
  { label: "Restaurants", href: "/restaurants", icon: UtensilsCrossed, copy: "Menus, hours, prices and local votes." },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, copy: "Buy, sell and find free stuff nearby." },
  { label: "Vote", href: "/vote", icon: Trophy, copy: "One-account community voting." },
  { label: "Events", href: "/events", icon: CalendarDays, copy: "What's happening across the valley." },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness, copy: "Local work without the national noise." },
  { label: "Housing", href: "/housing", icon: Home, copy: "Rooms, rentals and housing wanted." }
];

export default async function HomePage() {
  const [restaurants, listings, polls, events] = await Promise.all([
    getRestaurants({ limit: 6 }),
    getListings({ limit: 4 }),
    getPolls(),
    getEvents()
  ]);

  return (
    <main>
      <section className="border-b border-black/5 py-16 sm:py-24">
        <div className="container-site text-center">
          <p className="eyebrow">Aspen · Snowmass · Basalt · Carbondale · Glenwood · Rifle</p>
          <h1 className="text-balance mx-auto mt-4 max-w-5xl text-5xl font-black leading-[.97] tracking-[-.055em] sm:text-7xl">
            One local source for the whole valley.
          </h1>
          <p className="text-balance mx-auto mt-6 max-w-2xl text-base leading-7 text-[#596159] sm:text-lg">
            Find where to eat, what is for sale, who is hiring, what's happening tonight and what locals actually recommend.
          </p>
          <HeroSearch />
          <div className="mt-8">
            <TownStrip />
          </div>
        </div>
      </section>

      <section className="container-site py-12">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {sections.map(({ label, href, icon: Icon, copy }) => (
            <Link key={href} href={href} className="card group p-5 transition hover:-translate-y-1 hover:border-[#163b2d]/30">
              <Icon size={22} className="text-[#b8502f]" />
              <h2 className="mt-5 font-black">{label}</h2>
              <p className="mt-2 text-xs leading-5 text-[#677067]">{copy}</p>
              <ArrowRight size={16} className="mt-4 text-[#163b2d] transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site py-10">
        <SectionHeading eyebrow="Eat local" title="Restaurants people are talking about" href="/restaurants" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
        </div>
      </section>

      <section className="container-site grid gap-6 py-10 lg:grid-cols-[1.55fr_.85fr]">
        <div>
          <SectionHeading eyebrow="Marketplace" title="New near you" href="/marketplace" />
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </div>
        <div>
          {polls[0] ? <VotePanel poll={polls[0]} /> : null}
        </div>
      </section>

      <section className="container-site py-10">
        <SectionHeading eyebrow="Today & next" title="Around the valley" href="/events" />
        <div className="card divide-y divide-[#e2e2dc]">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#b8502f]">{getTown(event.town)?.name}</p>
                <h3 className="mt-1 font-black">{event.title}</h3>
                <p className="mt-1 text-sm text-[#677067]">{event.venue}</p>
              </div>
              <div className="rounded-xl bg-[#f2f0ea] px-3 py-2 text-right text-xs font-bold">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }).format(new Date(event.startsAt))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-site py-12">
        <div className="overflow-hidden rounded-[28px] bg-[#163b2d] p-8 text-white sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#d8b69f]">Built for locals</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-.04em] sm:text-4xl">One account. The entire Aspen-to-Rifle corridor.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                Post a classified, save restaurants, vote once in community polls, follow local events and keep your town view relevant.
              </p>
            </div>
            <Link href="/account" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#163b2d]">
              <MapPinned size={17} /> Create an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
