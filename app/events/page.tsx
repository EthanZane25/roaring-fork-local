import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import { getEvents } from "@/lib/data";
import { getTown } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Events",
  description: "Local events, live music and community happenings from Aspen to Rifle."
};

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <main className="container-site py-12">
      <p className="eyebrow">What's happening</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Events across the valley</h1>
      <div className="mt-10 card divide-y divide-[#e1e2dc]">
        {events.map((event) => (
          <article key={event.id} className="grid gap-4 p-6 sm:grid-cols-[110px_1fr]">
            <div className="rounded-2xl bg-[#f1efe9] p-4 text-center">
              <CalendarDays className="mx-auto text-[#b8502f]" size={20} />
              <p className="mt-2 text-xs font-black">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" }).format(new Date(event.startsAt))}
              </p>
              <p className="mt-1 text-xs text-[#687068]">
                {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }).format(new Date(event.startsAt))}
              </p>
            </div>
            <div>
              <p className="eyebrow">{event.category}</p>
              <h2 className="mt-1 text-xl font-black">{event.title}</h2>
              <p className="mt-2 flex items-center gap-1 text-sm text-[#606860]"><MapPin size={14} /> {event.venue} · {getTown(event.town)?.name}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
