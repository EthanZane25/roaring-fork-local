import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BedDouble } from "lucide-react";
import { getHousing } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { currency } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params; const town = getTown(slug);
  return town ? { title: `${town.name} Housing & Rentals`, description: `Rooms and rental housing listings in ${town.name}, Colorado.`, alternates: { canonical: `/${slug}/housing` } } : { title: "Housing" };
}
export default async function TownHousing({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params; const town = getTown(slug); if (!town) notFound();
  const listings = (await getHousing()).filter((item) => item.town === slug);
  return <main className="container-site py-12"><p className="eyebrow">Housing</p><h1 className="mt-3 text-4xl font-black">{town.name} rentals & rooms</h1><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{listings.map((item)=><article key={item.id} className="card p-6"><p className="eyebrow">{item.type}</p><p className="mt-3 text-2xl font-black">{currency(item.price)}<span className="text-sm text-[#6b736b]"> / mo</span></p><h2 className="mt-2 font-black">{item.title}</h2><p className="mt-4 flex items-center gap-1 text-sm text-[#626a62]"><BedDouble size={14}/>{item.bedrooms||"Studio"}</p></article>)}</div>{!listings.length?<div className="card mt-6 p-7 text-sm text-[#626a62]">No active housing listings yet.</div>:null}</main>;
}
