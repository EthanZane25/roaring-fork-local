"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Crosshair, List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { CUISINES, TOWNS, getTown } from "@/lib/constants";
import { RestaurantRow } from "@/components/restaurant-row";
import { distanceMiles, type Coordinates } from "@/lib/geo";

const RestaurantMap = dynamic(
  () => import("@/components/restaurant-map").then(module => module.RestaurantMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[520px] place-items-center bg-[#eef2ec] text-sm text-[#68716b]">
        Loading map…
      </div>
    )
  }
);

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
  initialTown?: string;
  initialCuisine?: string;
  initialOpen?: boolean;
};

type SortMode = "open" | "closest" | "votes" | "az";
type ViewMode = "list" | "map";

function normalize(value: string) {
  return value.trim().toLowerCase();
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
  const [coords, setCoords] = useState<Coordinates | null>(null);
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

  function requestLocation() {
    if (!navigator.geolocation) {
      setSort("open");
      setLocationMessage("Location is unavailable in this browser. Showing open restaurants first.");
      return;
    }

    setLocationMessage("Finding your location… It is only used in this browser to sort nearby restaurants.");
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ latitude: position.latitude, longitude: position.longitude });
        setSort("closest");
        setLocationMessage("Sorted by distance from you. Your location is not saved or shared.");
      },
      () => {
        setSort("open");
        setLocationMessage("We could not use your location. Showing open restaurants first.");
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }

  function chooseSort(value: SortMode) {
    if (value === "closest" && !coords) {
      requestLocation();
      return;
    }

    setSort(value);
  }

  function clearFilters() {
    setQuery("");
    setTown("");
    setCuisine("");
    setPrice("");
    setMeal("");
    setOpenOnly(false);
    setSort("open");
    setCoords(null);
    setLocationMessage("");
  }

  const hasFilters = Boolean(query || town || cuisine || price || meal || openOnly || sort !== "open");

  const distances = useMemo(() => {
    if (!coords) return new Map<string, number>();

    return new Map(
      filtered.map(restaurant => [
        restaurant.id,
        distanceMiles(coords, restaurant)
      ])
    );
  }, [coords, filtered]);

  return (
    <>
      <div className="mb-5 overflow-x-auto pb-2 [scrollbar-width:none]">
        <div className="flex min-w-max gap-2">
          {CUISINES.map((item) => {
            const active = cuisine === item.value;

            const count = item.value
              ? restaurants.filter(
                  (restaurant) =>
                    restaurant.cuisine === item.value ||
                    restaurant.cuisines.includes(item.value) ||
                    restaurant.tags.includes(item.value)
                ).length
              : restaurants.length;

            return (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => setCuisine(item.value)}
                aria-pressed={active}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? "border-[#173f30] bg-[#173f30] text-white"
                    : "border-[#d4dad5] bg-white text-[#4f5952] hover:border-[#8d9990]"
                }`}
              >
                {item.label}
                <span
                  className={`ml-2 text-xs ${
                    active ? "text-white/70" : "text-[#8a918c]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#dfe3de] bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_170px_170px]">
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

          <button
            type="button"
            onClick={requestLocation}
            aria-pressed={sort === "closest" && Boolean(coords)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${sort === "closest" && coords ? "border-[#173f30] bg-[#173f30] text-white" : "border-[#d4dad5] bg-white text-[#4f5952]"}`}
          >
            <Crosshair size={15} />
            Near me
          </button>

          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-[#d4dad5] bg-white px-4 text-sm font-semibold text-[#4f5952] [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal size={14} />
              More filters
              {price || meal ? (
                <span className="rounded-full bg-[#173f30] px-1.5 py-0.5 text-[10px] text-white">
                  {Number(Boolean(price)) + Number(Boolean(meal))}
                </span>
              ) : null}
            </summary>

            <div className="absolute left-0 top-[calc(100%+8px)] z-30 grid w-[280px] gap-4 rounded-xl border border-[#d9ddd8] bg-white p-4 shadow-[0_12px_35px_rgba(21,36,27,.14)]">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[.08em] text-[#737b75]">
                  Price
                </span>

                <select
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="min-h-11 rounded-lg border border-[#d4dad5] bg-white px-3 text-sm"
                >
                  <option value="">Any price</option>
                  <option value="1">$</option>
                  <option value="2">$$</option>
                  <option value="3">$$$</option>
                  <option value="4">$$$$</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[.08em] text-[#737b75]">
                  Meal
                </span>

                <select
                  value={meal}
                  onChange={(event) => setMeal(event.target.value)}
                  className="min-h-11 rounded-lg border border-[#d4dad5] bg-white px-3 text-sm"
                >
                  <option value="">Any meal</option>

                  {meals.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>

          <label className="flex min-h-11 items-center gap-2 rounded-full border border-[#d4dad5] bg-white px-3.5">
            <span className="text-xs font-semibold uppercase tracking-[.06em] text-[#7c847e]">
              Sort
            </span>

            {sort === "closest" ? (
              <Crosshair
                size={13}
                className="text-[#173f30]"
              />
            ) : null}

            <select
              value={sort}
              onChange={(event) =>
                chooseSort(event.target.value as SortMode)
              }
              className="bg-transparent text-sm font-medium text-[#3f4942] outline-none"
              aria-label="Sort restaurants"
            >
              <option value="open">
                Open first
              </option>
              <option value="closest">
                Closest
              </option>
              <option value="votes">
                Most local votes
              </option>
              <option value="az">
                A–Z
              </option>
            </select>
          </label>

          {hasFilters ? <button type="button" onClick={clearFilters} className="min-h-11 px-3 text-sm font-semibold text-[#173f30] hover:underline">Clear</button> : null}

          <div className="ml-auto flex rounded-lg border border-[#d5d9d4] bg-white p-1">
            <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`grid min-h-10 min-w-10 place-items-center rounded-md ${view === "list" ? "bg-[#f0f3ef] text-[#173f30]" : "text-[#69716b]"}`} aria-label="List view"><List size={17} /></button>
            <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={`grid min-h-10 min-w-10 place-items-center rounded-md ${view === "map" ? "bg-[#f0f3ef] text-[#173f30]" : "text-[#69716b]"}`} aria-label="Map view"><MapIcon size={17} /></button>
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
          {filtered.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} distance={distances.get(restaurant.id)} />)}
          {!filtered.length ? <p className="p-6 text-sm text-[#606a63]">No restaurants match those filters. Clear one or search another town.</p> : null}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#dfe3de] bg-[#eef2ec]">
          <div className="border-b border-[#d8ddd8] bg-white px-5 py-3 text-sm text-[#68716b]">
            {coords ? "Nearby restaurants · your approximate location is shown only to you" : "Matching restaurants across the Roaring Fork Valley"}
          </div>
          <RestaurantMap restaurants={filtered} userLocation={coords} />
        </div>
      )}

    </>
  );
}
