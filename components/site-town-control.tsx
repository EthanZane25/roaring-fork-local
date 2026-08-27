"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { TOWNS } from "@/lib/constants";

function distanceSquared(lat1: number, lon1: number, lat2: number, lon2: number) {
  const latScale = Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return (lat1 - lat2) ** 2 + ((lon1 - lon2) * latScale) ** 2;
}

export function SiteTownControl() {
  const [value, setValue] = useState("");

  useEffect(() => {
    const town = new URL(window.location.href).searchParams.get("town") || "";
    setValue(town);
  }, []);

  function navigate(town: string) {
    const url = new URL(window.location.href);
    if (town) url.searchParams.set("town", town);
    else url.searchParams.delete("town");
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  }

  function change(next: string) {
    if (next !== "near-me") {
      setValue(next);
      navigate(next);
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const closest = [...TOWNS].sort(
          (a, b) => distanceSquared(coords.latitude, coords.longitude, a.latitude, a.longitude) - distanceSquared(coords.latitude, coords.longitude, b.latitude, b.longitude)
        )[0];
        setValue(closest.slug);
        navigate(closest.slug);
      },
      () => setValue("")
    );
  }

  return (
    <label className="relative flex h-9 items-center border border-[#d8dad4] bg-white">
      <MapPin size={14} className="pointer-events-none absolute left-2.5 text-[#617068]" />
      <span className="sr-only">Town</span>
      <select
        value={value}
        onChange={(event) => change(event.target.value)}
        className="h-full w-[108px] appearance-none bg-transparent pl-8 pr-6 text-xs font-medium outline-none sm:w-[154px]"
        aria-label="Town"
      >
        <option value="">All towns</option>
        <option value="near-me">Near me</option>
        {TOWNS.map((town) => <option key={town.slug} value={town.slug}>{town.name}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-[#747b76]">▾</span>
    </label>
  );
}
