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

import {
  getEvents,
  getRestaurants
} from "@/lib/data";
import {
  cuisineLabel,
  getTown
} from "@/lib/constants";
import { HomeNearbyControl } from "@/components/home-nearby-control";

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
  const activeTown = town ? getTown(town) : undefined;

  const [allRestaurants, events] =
    await Promise.all([
      getRestaurants({
        town
      }),
      getEvents({
        town,
        limit: 3
      })
    ]);

  // Homepage placement is paid placement only.
  // Every restaurant remains available in the full restaurant directory.
  const restaurants = allRestaurants
    .filter((restaurant) => restaurant.isAdvertiser)
    .slice(0, 4);

  return (
    <main>
      <section className="relative isolate min-h-[470px] overflow-hidden sm:min-h-[518px]">
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

        <div className="container-site relative z-10 flex min-h-[470px] items-center sm:min-h-[518px]">
          <div className="w-full max-w-[560px] py-12">
            <h1 className="max-w-[530px] font-serif text-[44px] leading-[.98] tracking-[-.025em] text-white sm:text-[60px] lg:text-[64px]">
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

            <HomeNearbyControl town={town} />
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

      {restaurants.length ? (
      <section className="container-site py-14 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              Sponsored
            </p>

            <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-.03em] sm:text-[46px]">
              Featured restaurant partners
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
      </section>
      ) : null}

      <section className="border-y border-[#dedfd9] bg-white">
        <div className="container-site py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                {activeTown ? `Near ${activeTown.name}` : "Around town"}
              </p>

              <h2 className="mt-3 font-serif text-[36px] leading-none">
                {activeTown
                  ? `What’s happening near ${activeTown.name}`
                  : "What’s happening"}
              </h2>
            </div>

            <Link
              href={withTown("/events", town)}
              className="text-sm font-semibold text-[#173f30]"
            >
              See all events →
            </Link>
          </div>

          <div className="mt-7 grid gap-0 border-y border-[#e0e1dc] md:grid-cols-3">
            {events.length ? (
              events.map((event, index) => (
                <Link
                  key={event.id}
                  href={withTown("/events", town)}
                  className={`py-5 md:px-6 ${
                    index
                      ? "border-t border-[#e7e8e3] md:border-l md:border-t-0"
                      : ""
                  }`}
                >
                  <span className="font-serif text-lg text-[#173f30]">
                    {eventDate(event.startsAt)}
                  </span>

                  <strong className="mt-2 block text-sm">
                    {event.title}
                  </strong>

                  <span className="mt-1 block text-xs text-[#737a74]">
                    {event.venue} · {getTown(event.town)?.name}
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-6 text-sm text-[#6b736d]">
                Nothing listed yet.
              </p>
            )}
          </div>

          <div className="mt-9 flex flex-col gap-4 border-t border-[#dedfd9] pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">
                Marketplace
              </p>

              <p className="mt-2 text-sm text-[#646d66]">
                Buy and sell locally from Aspen to Rifle.
              </p>
            </div>

            <Link
              href={withTown("/marketplace", town)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#173f30]"
            >
              Browse Marketplace
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
