import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Home,
  Megaphone,
  Search,
  ShoppingBag,
  UsersRound,
  UtensilsCrossed
} from "lucide-react";
import { ListingCard } from "@/components/listing-card";
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

const heroTowns = [
  ["Aspen", "aspen"],
  ["Basalt", "basalt"],
  ["Carbondale", "carbondale"],
  ["Glenwood", "glenwood-springs"],
  ["Rifle", "rifle"]
] as const;

const categoryRail = [
  { label: "Eat", href: "/restaurants", icon: UtensilsCrossed },
  { label: "Shop", href: "/marketplace", icon: ShoppingBag },
  { label: "Live", href: "/housing", icon: Home },
  { label: "Work", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Gather", href: "/events", icon: UsersRound },
  { label: "Voice", href: "/vote", icon: Megaphone }
] as const;

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ town?: string }>;
}) {
  const { town } = await searchParams;

  const [events, listings, restaurants, sponsors] = await Promise.all([
    getEvents({ town, limit: 3, todayOnly: true }),
    getListings({ town, limit: 6 }),
    getRestaurants({ town, limit: 24 }),
    getRestaurants({ town, advertiserOnly: true, limit: 3 })
  ]);

  const featuredRestaurants = [...restaurants]
    .sort((a, b) => b.localVotes - a.localVotes)
    .slice(0, 4);

  return (
    <main>
      <section className="relative min-h-[500px] overflow-hidden bg-[#142219] sm:min-h-[520px]">
        <Image
          src="/roaring-fork-valley-hero.jpg"
          alt="Roaring Fork Valley"
          fill
          priority
          unoptimized
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,18,13,.43)_0%,rgba(10,18,13,.20)_44%,rgba(10,18,13,.03)_78%),linear-gradient(0deg,rgba(7,14,10,.30)_0%,rgba(7,14,10,.02)_52%)]" />

        <div className="container-site relative z-10 flex min-h-[500px] items-end pb-10 pt-20 sm:min-h-[520px] sm:pb-11">
          <div className="w-full max-w-[640px]">
            <h1 className="max-w-[560px] font-serif text-[52px] font-normal leading-[1.01] tracking-[-.035em] text-white sm:text-[60px] lg:text-[64px]">
              The valley, all in one place.
            </h1>

            <p className="mt-4 max-w-[560px] text-[16px] leading-7 text-white/94">
              Food, work, housing & community from Aspen to Rifle
            </p>

            <form
              action="/search"
              className="mt-6 flex w-full max-w-[575px] overflow-hidden rounded-[11px] border border-white/80 bg-white shadow-[0_8px_25px_rgba(0,0,0,.16)]"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <Search size={21} className="shrink-0 text-[#66716a]" strokeWidth={1.7} />
                <span className="sr-only">Search Roaring Fork Local</span>
                <input
                  name="q"
                  placeholder="Search restaurants, jobs, housing..."
                  className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-[#1f2822] outline-none placeholder:text-[#737b75]"
                />
              </label>
              {town ? <input type="hidden" name="town" value={town} /> : null}
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-white">
              <Link
                href="/"
                className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm ${
                  !town
                    ? "border-white bg-white text-[#173f30]"
                    : "border-white/85 bg-black/10 text-white hover:bg-white/12"
                }`}
              >
                All
              </Link>

              {heroTowns.map(([label, slug]) => {
                const selected = town === slug;
                return (
                  <Link
                    key={slug}
                    href={`/?town=${slug}`}
                    aria-current={selected ? "page" : undefined}
                    className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm ${
                      selected
                        ? "border-white bg-white"
                        : "border-white/85 bg-black/10 hover:bg-white/12"
                    }`}
                  >
                    <span style={{ color: selected ? "#173f30" : "#ffffff" }}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d5cc] bg-[#f7f4ec]">
        <div className="container-site grid grid-cols-3 divide-x divide-[#d5d2c9] sm:grid-cols-6">
          {categoryRail.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={withTown(href, town)}
              className="flex min-h-[98px] items-center justify-center gap-3 px-3 text-[#173f30] transition hover:bg-white/60"
            >
              <Icon size={27} strokeWidth={1.45} />
              <span className="text-[16px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Eat local</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">
              Restaurants worth knowing
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#646d66]">
              Curated local pages with current details, useful filters, and verified information—not a wall of anonymous star ratings.
            </p>
          </div>
          <Link
            href={withTown("/restaurants", town)}
            className="text-sm font-semibold text-[#173f30] hover:underline"
          >
            All restaurants →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredRestaurants.map((restaurant, index) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.slug}`}
              className="group overflow-hidden rounded-xl border border-[#dedfd9] bg-white"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e9ebe7]">
                {restaurant.imageUrl ? (
                  <Image
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : null}
                <span className="absolute left-3 top-3 rounded-md bg-white/94 px-2 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#263128]">
                  Local pick #{index + 1}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-[17px] font-semibold leading-5">{restaurant.name}</h3>
                <p className="mt-2 text-[13px] text-[#6a726b]">
                  {getTown(restaurant.town)?.name} · {cuisineLabel(restaurant.cuisine)} · {"$".repeat(restaurant.priceLevel)}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-[#4f6759]">
                  {restaurant.verifiedAt ? <span>Verified</span> : null}
                  {restaurant.openNow === true ? <span>Open now</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CUISINES.filter((item) => item.value).map((cuisine) => (
            <Link
              key={cuisine.value}
              href={withTown(`/restaurants?cuisine=${cuisine.value}`, town)}
              className="shrink-0 rounded-full border border-[#d8dad4] bg-white px-4 py-2 text-sm font-medium text-[#454d47] hover:border-[#9ca79f]"
            >
              {cuisine.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dedfd9] bg-white">
        <div className="container-site py-10 sm:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Local classifieds</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">
                New in Marketplace
              </h2>
              <p className="mt-2 text-[15px] text-[#646d66]">
                Local first. Clear prices. Fresh listings. No algorithmic feed.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={withTown("/marketplace", town)}
                className="text-sm font-semibold text-[#173f30] hover:underline"
              >
                Browse →
              </Link>
              <Link
                href="/marketplace/new"
                className="rounded-lg bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Post a listing
              </Link>
            </div>
          </div>

          {listings.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 3).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[#c9cec9] bg-[#fbfcfa] p-8 text-center">
              <ShoppingBag className="mx-auto text-[#77817a]" size={28} />
              <h3 className="mt-3 font-semibold">Be one of the first local sellers</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#68716a]">
                Post something for sale and help build a cleaner valley-wide marketplace.
              </p>
              <Link
                href="/marketplace/new"
                className="mt-4 inline-flex rounded-lg bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Post the first listing
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Right now</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">
              Tonight in the valley
            </h2>
          </div>
          <Link
            href={withTown("/events", town)}
            className="text-sm font-semibold text-[#173f30] hover:underline"
          >
            All events →
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#dedfd9] bg-white">
          {events.map((event, index) => (
            <Link
              key={event.id}
              href={withTown("/events", town)}
              className={`grid gap-2 px-4 py-4 transition hover:bg-[#f7f7f3] sm:grid-cols-[135px_1fr_180px] sm:items-center ${
                index ? "border-t border-[#e7e9e4]" : ""
              }`}
            >
              <span className="text-[13px] font-semibold text-[#68716a]">
                {eventTime(event.startsAt)}
              </span>
              <strong className="text-[15px]">{event.title}</strong>
              <span className="text-[13px] text-[#6b736d] sm:text-right">
                {event.venue} · {getTown(event.town)?.name}
              </span>
            </Link>
          ))}
          {!events.length ? (
            <p className="px-4 py-5 text-sm text-[#666e68]">
              Nothing is listed for tonight yet.
            </p>
          ) : null}
        </div>
      </section>

      {sponsors.length ? (
        <section className="container-site pb-12">
          <div className="flex items-center justify-between border-b border-[#dedfd9] pb-3">
            <div>
              <p className="eyebrow">Sponsored locally</p>
              <h2 className="mt-2 text-xl font-semibold">Support local businesses</h2>
            </div>
            <span className="text-[11px] text-[#777f79]">Paid placement</span>
          </div>

          <div className="grid gap-4 pt-5 md:grid-cols-3">
            {sponsors.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.slug}`}
                className="flex gap-3 rounded-xl border border-[#dedfd9] bg-white p-3"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-[#eceeea]">
                  {restaurant.imageUrl ? (
                    <Image
                      src={restaurant.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#8a6a22]">
                    Sponsored
                  </span>
                  <p className="mt-1 truncate text-sm font-semibold">{restaurant.name}</p>
                  <p className="mt-1 text-xs text-[#6c746e]">
                    {getTown(restaurant.town)?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-[#dedfd9] bg-[#f2f0e9]">
        <div className="container-site flex flex-col gap-5 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">One local account</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">
              One account for the whole valley.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f675f]">
              Post Marketplace listings, save local places, message sellers and take part in verified community voting.
            </p>
          </div>
          <Link
            href="/account"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#173f30] px-5 py-3 text-sm font-semibold text-white"
          >
            Create or sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
