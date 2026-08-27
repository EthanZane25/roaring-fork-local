import Image from "next/image";
import Link from "next/link";
import { PrimaryNav } from "@/components/primary-nav";
import { getEvents, getRestaurants } from "@/lib/data";
import { cuisineLabel, getTown } from "@/lib/constants";

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const [events, sponsors] = await Promise.all([
    getEvents({ town, limit: 3, todayOnly: true }),
    getRestaurants({ town, advertiserOnly: true, limit: 3 })
  ]);

  return (
    <main>
      <section className="bg-white">
        <div className="container-site py-12 sm:py-16">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Local life, all in one place.</h1>
            <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#5f665f] sm:text-lg">
              Food, classifieds, jobs, housing, and local votes from Aspen to Rifle.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dedfd9] bg-white">
        <div className="container-site">
          <PrimaryNav town={town} />
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#d6d8d2] pb-3">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Tonight</h2>
          <Link href={town ? `/events?town=${town}` : "/events"} className="text-sm font-semibold text-[#315e49] hover:underline">See all events →</Link>
        </div>
        <div className="bg-white">
          {events.map((event, index) => (
            <Link
              key={event.id}
              href={town ? `/events?town=${town}` : "/events"}
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

      {sponsors.length ? (
        <section className="container-site pb-12 pt-2 sm:pb-16">
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
    </main>
  );
}
