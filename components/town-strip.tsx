import Link from "next/link";
import { MapPin } from "lucide-react";
import { TOWNS } from "@/lib/constants";

export function TownStrip() {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-2">
        {TOWNS.map((town) => (
          <Link
            key={town.slug}
            href={`/${town.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[#163b2d]/40"
          >
            <MapPin size={14} className="text-[#b8502f]" /> {town.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
