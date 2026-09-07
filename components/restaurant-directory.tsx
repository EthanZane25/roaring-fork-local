"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Crosshair, List, Map, Search, X } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { CUISINES, TOWNS, cuisineLabel, getTown } from "@/lib/constants";
import { RestaurantRow } from "@/components/restaurant-row";

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
  initialTown?: string;
  initialCuisine?: string;
  initialOpen?: boolean;
};

type SortMode = "open" | "closest" | "votes" | "az";
type ViewMode = "list" | "map";
type Coords = { latitude: number; longitude: number };

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function distanceMiles(a: Coords, b: Coords) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function RestaurantDirectory({
  restaurants,
  initialTown = "",
  initialCuisine = "",
  initialOpen = false
}: RestaurantDirectoryProps) {
  const [query, setQuery] = useState("");
  const [town, setTown] = useState(initialTown);
  const [cuisine, setCuisine] = useState(CUISINES.some((item) => item.value === initialCuisine) ? initialCuisine : "");
  const [price, setPrice] = useState("");
  const [meal, setMeal] = useState("");
  const [openOnly, setOpenOnly] = useState(initialOpen);
  const [sort, setSort] = useState<SortMode>("open");
  const [view, setView] = useState<ViewMode>("list");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  const meals = useMemo(
    () => Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.meals))).filter(Boolean).sort(),
    [restaurants]
  );

  const filtered = useMemo(() => {
    const needle = normalize(query);
    const result = restaurants.filter((restaurant) => {
      if (town && restaurant.town !== town) return false;
      if (cuisine && restaurant.cuisine !== cuisine && !restaurant.cuisines.includes(cuisine)) return false;
      if (price && restaurant.priceLevel !== Number(price)) return false;
      if (meal && !restaurant.meals.includes(meal)) return false;
      if (openOnly && restaurant.openNow !== true) return false;
      if (!needle) return true;

      return [
        restaurant.name,
        restaurant.address,
        restaurant.cuisine,
        ...restaurant.cuisines,
        ...restaurant.meals,
        ...restaurant.tags
      ].join(" ").toLowerCase().includes(needle);
    });

    return [...result].sort((a, b) => {
      if (sort === "votes") return b.localVotes - a.localVotes;
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "closest" && coords) {
        return distanceMiles(coords, a) - distanceMiles(coords, b);
      }
      if (sort === "open") {
        const openDelta = Number(b.openNow === true) - Number(a.openNow === true);
        return openDelta || b.localVotes - a.localVotes || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [restaurants, query, town, cuisine, price, meal, openOnly, sort, coords]);

  function chooseSort(value: SortMode) {
    setSort(value);
    if (value !== "closest" || coords) return;

    if (!navigator.geolocation) {
      setLocationMessage("Location unavailable. Choose Open now, Most votes, or A–Z.");
      return;
    }

    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ latitude: position.latitude, longitude: position.longitude });
        setLocationMessage("Sorted by distance from you.");
      },
      () => {
        setSort("open");
        setLocationMessage("Location unavailable. Showing open restaurants first.");
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }

  function clearFilters() {
    setQuery("");
    setTown("");
    setCuisine("");
    setPrice("");
    setMeal("");
    setOpenOnly(false);
    setSort("open");
    setLocationMessage("");
  }

  const hasFilters = Boolean(query || town || cuisine || price || meal || openOnly);

  return (
    <>
      <div className="rounded-2xl border border-[#dfe3de] bg-white p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_150px_120px_150px]">
          <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[#d4dad5] bg-white px-3.5 focus-within:border-[#2f6b52] focus-within:shadow-[0_0_0_3px_rgba(47,107,82,0.08)]">
            <span className="sr-only">Search restaurants</span>
            <Search className="shrink-0 text-[#777f79]" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, cuisine, dish…" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none" />
            {query ? <button type="button" onClick={() => setQuery("")} className="grid h-9 w-9 place-items-center text-[#777f79]" aria-label="Clear restaurant search"><X size={16} /></button> : null}
          </label>

          <select value={town} onChange={(event) => setTown(event.target.value)} className="min-h-11 rounded-xl border border-[#d4dad5] bg-white px-3 text-sm font-medium">
            <option value="">All towns</option>
            {TOWNS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>

          <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="min-h-11 rounded-xl border border-[#d4dad5] bg-white px-3 text-sm font-medium">
            {CUISINES.map((item) => <option key={item.value || "all"} value={item.value}>{item.value ? item.label : "All cuisines"}</option>)}
          </select>

          <select value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-11 rounded-xl border border-[#d4dad5] bg-white px-3 text-sm font-medium">
            <option value="">Any price</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>

          <select value={meal} onChange={(event) => setMeal(event.target.value)} className="min-h-11 rounded-xl border border-[#d4dad5] bg-white px-3 text-sm font-medium">
            <option value="">Any meal</option>
            {meals.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenOnly((value) => !value)}
            aria-pressed={openOnly}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${openOnly ? "border-[#173f30] bg-[#173f30] text-white" : "border-[#d4dad5] bg-white text-[#4f5952]"}`}
          >
            Open now
          </button>

          <span className="ml-1 text-xs font-semibold uppercase tracking-[.08em] text-[#7c847e]">Sort</span>
          {[
            ["open", "Open first"],
            ["closest", "Closest"],
            ["votes", "Most votes"],
            ["az", "A–Z"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseSort(value as SortMode)}
              aria-pressed={sort === value}
              className={`min-h-11 rounded-full border px-3.5 text-sm font-medium ${sort === value ? "border-[#8ea397] bg-[#eef3ef] text-[#173f30]" : "border-[#d7dad5] bg-white text-[#5c655f]"}`}
            >
              {value === "closest" ? <Crosshair size={14} className="mr-1.5 inline" /> : null}{label}
            </button>
          ))}

          {hasFilters ? <button type="button" onClick={clearFilters} className="min-h-11 px-3 text-sm font-semibold text-[#173f30] hover:underline">Clear</button> : null}

          <div className="ml-auto flex rounded-lg border border-[#d5d9d4] bg-white p-1">
            <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`grid min-h-10 min-w-10 place-items-center rounded-md ${view === "list" ? "bg-[#f0f3ef] text-[#173f30]" : "text-[#69716b]"}`} aria-label="List view"><List size={17} /></button>
            <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={`grid min-h-10 min-w-10 place-items-center rounded-md ${view === "map" ? "bg-[#f0f3ef] text-[#173f30]" : "text-[#69716b]"}`} aria-label="Map view"><Map size={17} /></button>
          </div>
        </div>

        {locationMessage ? <p role="status" className="mt-3 text-xs text-[#6c756e]">{locationMessage}</p> : null}
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{filtered.length} restaurant{filtered.length === 1 ? "" : "s"}</h2>
        {town ? <span className="text-sm text-[#707871]">{getTown(town)?.name}</span> : <span className="text-sm text-[#707871]">Aspen to Rifle</span>}
      </div>

      {view === "list" ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#dfe3de] bg-white">
          {filtered.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
          {!filtered.length ? <p className="p-6 text-sm text-[#606a63]">No restaurants match those filters. Clear one or search another town.</p> : null}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#dfe3de] bg-[#eef2ec]">
          <div className="border-b border-[#d8ddd8] bg-white px-5 py-3 text-sm text-[#68716b]">
            Valley map · approximate corridor view
          </div>
          <div className="relative min-h-[520px] overflow-hidden">
            <div className="absolute bottom-[7%] left-[14%] top-[7%] w-[5px] rotate-[18deg] rounded-full bg-[#c5cec5]" aria-hidden="true" />
            {filtered.map((restaurant) => {
              const latRange = 39.62 - 39.16;
              const lonRange = -106.78 - -107.82;
              const top = restaurant.latitude ? Math.max(8, Math.min(88, ((39.62 - restaurant.latitude) / latRange) * 80 + 8)) : 50;
              const left = restaurant.longitude ? Math.max(12, Math.min(88, ((restaurant.longitude - -107.82) / lonRange) * 76 + 12)) : 50;
              return (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.slug}`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#173f30] text-xs font-bold text-white shadow-md">{restaurant.name.charAt(0)}</span>
                  <span className="pointer-events-none absolute left-1/2 top-10 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold shadow-lg group-hover:block group-focus:block">
                    {restaurant.name} · {getTown(restaurant.town)?.name}
                  </span>
                </Link>
              );
            })}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/92 p-3 text-xs leading-5 text-[#626b65] shadow-sm">
              <strong className="block text-[#263029]">Roaring Fork corridor</strong>
              Use list view for exact addresses and directions.
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {CUISINES.filter((item) => item.value).map((item) => (
          <Link
            key={item.value}
            href={`/restaurants?cuisine=${item.value}${town ? `&town=${encodeURIComponent(town)}` : ""}`}
            className="min-h-11 rounded-full border border-[#d8dad4] bg-white px-4 py-3 text-sm font-medium text-[#454d47] hover:border-[#9ca79f]"
          >
            {cuisineLabel(item.value)}
          </Link>
        ))}
      </div>
    </>
  );
}
