import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { getEvents } from "@/lib/data";
import { getTown } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params; const town = getTown(slug);
  return town ? { title: `${town.name} Events`, description: `Upcoming events and local happenings in ${town.name}, Colorado.`, alternates: { canonical: `/${slug}/events` } } : { title: "Events" };
}
export default async function TownEvents({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params; const town = getTown(slug); if (!town) notFound();
  const events = (await getEvents()).filter((event) => event.town === slug);
  return <main className="container-site py-12"><p className="eyebrow">Local calendar</p><h1 className="mt-3 text-4xl font-black">{town.name} events</h1><div className="card mt-9 divide-y divide-[#e1e2dc]">{events.map((event)=><article key={event.id} className="p-6"><p className="eyebrow">{event.category}</p><h2 className="mt-2 text-xl font-black">{event.title}</h2><p className="mt-2 flex items-center gap-1 text-sm text-[#626a62]"><CalendarDays size={14}/>{new Date(event.startsAt).toLocaleString("en-US",{timeZone:"America/Denver",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p><p className="mt-1 flex items-center gap-1 text-sm text-[#626a62]"><MapPin size={14}/>{event.venue}</p></article>)}</div>{!events.length?<div className="card mt-6 p-7 text-sm text-[#626a62]">No published upcoming events yet.</div>:null}</main>;
}
