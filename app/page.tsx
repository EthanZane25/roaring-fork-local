import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  House,
  MapPin,
  Megaphone,
  Search,
  ShoppingBag,
  UsersRound,
  UtensilsCrossed
} from "lucide-react";

import { ListingCard } from "@/components/listing-card";
import {
  getEvents,
  getListings,
  getRestaurants
} from "@/lib/data";
import {
  cuisineLabel,
  getTown
} from "@/lib/constants";

const TOWNS = [
  ["All", ""],
  ["Aspen", "aspen"],
  ["Basalt", "basalt"],
  ["Carbondale", "carbondale"],
  ["Glenwood", "glenwood-springs"],
  ["Rifle", "rifle"]
] as const;

const CATEGORIES = [
  {
    label: "Eat",
    href: "/restaurants",
    icon: UtensilsCrossed
  },
  {
    label: "Shop",
    href: "/marketplace",
    icon: ShoppingBag
  },
  {
    label: "Live",
    href: "/housing",
    icon: House
  },
  {
    label: "Work",
    href: "/jobs",
    icon: BriefcaseBusiness
  },
  {
    label: "Gather",
    href: "/events",
    icon: UsersRound
  },
  {
    label: "Voice",
    href: "/vote",
    icon: Megaphone
  }
] as const;

function withTown(path: string, town?: string) {
  if (!town) return path;

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}town=${encodeURIComponent(town)}`;
}

function eventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ town?: string }>;
}) {
  const { town } = await searchParams;

  const [restaurants, listings, events] =
    await Promise.all([
      getRestaurants({
        town,
        limit: 4
      }),
      getListings({
        town,
        limit: 3
      }),
      getEvents({
        town,
        limit: 3
      })
    ]);

  return (
    <main>
      <section className="relative isolate min-h-[518px] overflow-hidden">
        <Image
          src="/roaring-fork-valley-hero.jpg"
          alt="Roaring Fork Valley in autumn"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,17,12,.42)_0%,rgba(10,17,12,.16)_55%,rgba(10,17,12,.08)_100%)]" />

        <div className="container-site relative z-10 flex min-h-[518px] items-center">
          <div className="w-full max-w-[560px] py-12">
            <h1 className="max-w-[530px] font-serif text-[52px] leading-[.98] tracking-[-.025em] text-white sm:text-[60px] lg:text-[64px]">
              The valley, all in one
              <br />
              place.
            </h1>

            <p className="mt-5 text-[17px] leading-7 text-white">
              Food, work, housing &amp; community from Aspen to Rifle
            </p>

            <form
              action="/search"
              method="get"
              role="search"
              className="mt-7 w-full max-w-[535px]"
            >
              {town ? (
                <input
                  type="hidden"
                  name="town"
                  value={town}
                />
              ) : null}

              <label className="flex h-[59px] items-center gap-4 rounded-[12px] bg-white px-4 shadow-[0_2px_9px_rgba(0,0,0,.18)]">
                <span className="sr-only">
                  Search Roaring Fork Local
                </span>

                <Search
                  size={25}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#66706a]"
                />

                <input
                  name="q"
                  placeholder="Search restaurants, jobs, housing..."
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-[#252925] outline-none placeholder:text-[#6f736f]"
                />
              </label>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {TOWNS.map(([label, slug], index) => {
                const active =
                  slug === ""
                    ? !town
                    : town === slug;

                return (
                  <div
                    key={label}
                    className="flex items-center gap-2"
                  >
                    {index > 0 ? (
                      <span className="text-white/80">
                        ·
                      </span>
                    ) : null}

                    <Link
                      href={
                        slug
                          ? `/?town=${slug}`
                          : "/"
                      }
                      className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                        active
                          ? "border-white bg-white/10 text-white"
                          : "border-white/90 bg-transparent text-white hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfdbcf] bg-[#faf7ef]">
        <div className="container-site grid grid-cols-3 sm:grid-cols-6">
          {CATEGORIES.map(
            ({
              label,
              href,
              icon: Icon
            }, index) => (
              <Link
                key={label}
                href={withTown(href, town)}
                className={`group flex min-h-[118px] items-center justify-center gap-4 px-4 text-[#173f30] transition hover:bg-[#f2eee4] ${
                  index > 0
                    ? "border-l border-[#ded9cc]"
                    : ""
                }`}
              >
                <Icon
                  size={34}
                  strokeWidth={1.35}
                  className="shrink-0"
                />

                <span className="text-[16px] font-medium">
                  {label}
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="container-site py-14 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              Eat local
            </p>

            <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-.03em] sm:text-[46px]">
              Restaurants worth knowing
            </h2>
          </div>

          <Link
            href={withTown(
              "/restaurants",
              town
            )}
            className="hidden items-center gap-2 text-sm font-semibold text-[#173f30] hover:underline sm:flex"
          >
            Explore restaurants
            <ArrowRight size={15} />
          </Link>
        </div>

        {restaurants.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.map(
              restaurant => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.slug}`}
                  className="group border-t border-[#cfd1ca] pt-5"
                >
                  <h3 className="font-serif text-[23px] leading-tight group-hover:underline">
                    {restaurant.name}
                  </h3>

                  <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.08em] text-[#6a736c]">
                    <MapPin size={12} />
                    {
                      getTown(
                        restaurant.town
                      )?.name
                    }
                  </p>

                  <p className="mt-3 text-sm text-[#59615b]">
                    {cuisineLabel(
                      restaurant.cuisine
                    )}{" "}
                    ·{" "}
                    {"$".repeat(
                      restaurant.priceLevel
                    )}
                  </p>
                </Link>
              )
            )}
          </div>
        ) : (
          <p className="mt-8 text-sm text-[#6a736c]">
            No restaurants are listed yet.
          </p>
        )}
      </section>

      <section className="border-y border-[#dedfd9] bg-white">
        <div className="container-site grid gap-12 py-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Marketplace
                </p>

                <h2 className="mt-3 font-serif text-[36px] leading-none">
                  Fresh from the valley
                </h2>
              </div>

              <Link
                href={withTown(
                  "/marketplace",
                  town
                )}
                className="text-sm font-semibold text-[#173f30]"
              >
                Browse all →
              </Link>
            </div>

            {listings.length ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map(
                  listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="mt-7 text-sm text-[#6b736d]">
                No fresh listings yet.
              </p>
            )}
          </div>

          <div>
            <p className="eyebrow">
              Around town
            </p>

            <h2 className="mt-3 font-serif text-[36px] leading-none">
              What’s happening
            </h2>

            <div className="mt-7 border-y border-[#e0e1dc]">
              {events.length ? (
                events.map(
                  (event, index) => (
                    <Link
                      key={event.id}
                      href={withTown(
                        "/events",
                        town
                      )}
                      className={`grid grid-cols-[70px_1fr] gap-4 py-5 ${
                        index
                          ? "border-t border-[#e7e8e3]"
                          : ""
                      }`}
                    >
                      <span className="font-serif text-lg text-[#173f30]">
                        {eventDate(
                          event.startsAt
                        )}
                      </span>

                      <span>
                        <strong className="block text-sm">
                          {event.title}
                        </strong>

                        <span className="mt-1 block text-xs text-[#737a74]">
                          {event.venue} ·{" "}
                          {
                            getTown(
                              event.town
                            )?.name
                          }
                        </span>
                      </span>
                    </Link>
                  )
                )
              ) : (
                <p className="py-6 text-sm text-[#6b736d]">
                  Nothing listed yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
