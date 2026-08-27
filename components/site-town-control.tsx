"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { MapPin } from "lucide-react";
import { TOWNS } from "@/lib/constants";

const TOWN_STORAGE_KEY = "rfl-town";
const TOWN_COOKIE = "rfl_town";
const TOWN_CHANGE_EVENT = "rfl-town-change";

function distanceSquared(lat1: number, lon1: number, lat2: number, lon2: number) {
  const latScale = Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return (lat1 - lat2) ** 2 + ((lon1 - lon2) * latScale) ** 2;
}

function currentTown() {
  if (typeof window === "undefined") return "";
  const urlTown = new URL(window.location.href).searchParams.get("town") || "";
  return urlTown || window.localStorage.getItem(TOWN_STORAGE_KEY) || "";
}

function subscribeTown(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("popstate", callback);
  window.addEventListener(TOWN_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener(TOWN_CHANGE_EVENT, callback);
  };
}

function rememberTown(town: string) {
  if (town) {
    window.localStorage.setItem(TOWN_STORAGE_KEY, town);
    document.cookie = `${TOWN_COOKIE}=${encodeURIComponent(town)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } else {
    window.localStorage.removeItem(TOWN_STORAGE_KEY);
    document.cookie = `${TOWN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
  window.dispatchEvent(new Event(TOWN_CHANGE_EVENT));
}

export function SiteTownControl() {
  const router = useRouter();
  const value = useSyncExternalStore(subscribeTown, currentTown, () => "");

  function navigate(town: string) {
    rememberTown(town);
    const url = new URL(window.location.href);
    if (town) url.searchParams.set("town", town);
    else url.searchParams.delete("town");
    router.push(`${url.pathname}${url.search}${url.hash}`);
  }

  function change(next: string) {
    if (next !== "near-me") {
      navigate(next);
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const closest = [...TOWNS].sort(
        (a, b) => distanceSquared(coords.latitude, coords.longitude, a.latitude, a.longitude) - distanceSquared(coords.latitude, coords.longitude, b.latitude, b.longitude)
      )[0];
      navigate(closest.slug);
    });
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
