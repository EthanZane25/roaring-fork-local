import type { Metadata } from "next";
import { getEvents } from "@/lib/data";
import { getTown } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Events",
  description: "Local events, live music and community happenings from Aspen to Rifle."
};

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Denver" }).format(new Date(value));
}

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Denver" }).format(new Date(value));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }).format(new Date(value));
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const events = await getEvents({ town });
  const groups = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = dayKey(event.startsAt);
    (acc[key] ||= []).push(event);
    return acc;
  }, {});

  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Events</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">What’s happening across the corridor, grouped by day.</p>

      <div className="mt-9 space-y-9">
        {Object.entries(groups).map(([key, dayEvents]) => (
          <section key={key}>
            <h2 className="border-b border-[#cfd2cc] pb-3 text-lg font-semibold">{dayLabel(dayEvents[0].startsAt)}</h2>
            <div>
              {dayEvents.map((event, index) => (
                <article key={event.id} className={`grid gap-1 py-4 sm:grid-cols-[160px_1fr_120px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
                  <span className="text-[13px] font-semibold text-[#667068]">{getTown(event.town)?.name}</span>
                  <div>
                    <h3 className="text-[16px] font-semibold">{event.title}</h3>
                    <p className="mt-1 text-[13px] text-[#737a74]">{event.venue}</p>
                  </div>
                  <time dateTime={event.startsAt} className="text-[13px] text-[#5f665f] sm:text-right">{timeLabel(event.startsAt)}</time>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!events.length ? <p className="border-y border-[#dfe1db] py-6 text-sm text-[#606860]">No upcoming events match this town yet.</p> : null}
      </div>
    </main>
  );
}
