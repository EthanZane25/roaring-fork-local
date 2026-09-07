"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ChevronDown, MapPin } from "lucide-react";
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

export function SiteTownControl({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const value = useSyncExternalStore(subscribeTown, currentTown, () => "");
  const [message, setMessage] = useState("");

  function navigate(town: string) {
    rememberTown(town);
    setMessage("");
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

    if (!navigator.geolocation) {
      setMessage("Location unavailable — choose a town.");
      return;
    }

    setMessage("Finding nearest town…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const closest = [...TOWNS].sort(
          (a, b) =>
            distanceSquared(coords.latitude, coords.longitude, a.latitude, a.longitude) -
            distanceSquared(coords.latitude, coords.longitude, b.latitude, b.longitude)
        )[0];
        navigate(closest.slug);
      },
      () => setMessage("Location unavailable — choose a town."),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }

  return (
    <div className="min-w-0">
      <label className={`relative flex min-w-[142px] items-center rounded-xl border border-[#d8ddd8] bg-white pl-3 pr-2 transition focus-within:border-[#2f6b52] ${compact ? "h-10" : "h-11"}`}>
        <MapPin size={16} strokeWidth={1.8} className="shrink-0 text-[#627168]" aria-hidden="true" />
        <span className="sr-only">Town</span>
        <select
          value={value}
          onChange={(event) => change(event.target.value)}
          className="h-full min-w-0 flex-1 appearance-none bg-transparent pl-2 pr-7 text-sm font-semibold text-[#27302a] outline-none"
          aria-label="Town"
        >
          <option value="">All towns</option>
          <option value="near-me">Near me</option>
          {TOWNS.map((town) => <option key={town.slug} value={town.slug}>{town.name}</option>)}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 text-[#737c75]" aria-hidden="true" />
      </label>
      {message ? <p role="status" className="mt-1 text-[11px] text-[#6c756e]">{message}</p> : null}
    </div>
  );
}
