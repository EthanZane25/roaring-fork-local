"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { CUISINES } from "@/lib/constants";
import { RestaurantRow } from "@/components/restaurant-row";

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
  initialTown?: string;
  initialCuisine?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function RestaurantDirectory({ restaurants, initialTown = "", initialCuisine = "" }: RestaurantDirectoryProps) {
  const [query, setQuery] = useState("");
  const validCuisine = CUISINES.some((item) => item.value === initialCuisine) ? initialCuisine : "";

  const searched = useMemo(() => {
    const needle = normalize(query);
    return restaurants.filter((restaurant) => {
      if (validCuisine && restaurant.cuisine !== validCuisine) return false;
      if (!needle) return true;
      return [restaurant.name, restaurant.address, restaurant.cuisine, ...restaurant.cuisines, ...restaurant.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [restaurants, query, validCuisine]);

  const groups = useMemo(() => {
    return CUISINES
      .filter((item) => item.value)
      .map((item) => ({
        ...item,
        restaurants: searched.filter((restaurant) => restaurant.cuisine === item.value)
      }))
      .filter((group) => group.restaurants.length > 0);
  }, [searched]);

  function cuisineHref(cuisine: string) {
    const params = new URLSearchParams();
    if (cuisine) params.set("cuisine", cuisine);
    if (initialTown) params.set("town", initialTown);
    const suffix = params.toString();
    return suffix ? `/restaurants?${suffix}` : "/restaurants";
  }

  return (
    <>
      <div className="mt-7 max-w-xl">
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-[#d4dad5] bg-white px-3.5 focus-within:border-[#2f6b52] focus-within:shadow-[0_0_0_3px_rgba(47,107,82,0.08)]">
          <span className="sr-only">Search within restaurants</span>
          <Search className="shrink-0 text-[#777f79]" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search within restaurants"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="text-[#777f79]" aria-label="Clear restaurant search">
              <X size={16} />
            </button>
          ) : null}
        </label>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CUISINES.map((item) => {
          const active = item.value === validCuisine;
          return (
            <Link
              key={item.value || "all"}
              href={cuisineHref(item.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                active
                  ? "border-[#123c2f] bg-[#123c2f] text-white"
                  : "border-[#d4dad5] bg-white text-[#4f5952] hover:border-[#b8c5bc]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        {validCuisine ? (
          <section>
            <div className="flex items-baseline justify-between gap-4 border-b border-[#cfd5d0] pb-3">
              <h2 className="text-xl font-semibold">{CUISINES.find((item) => item.value === validCuisine)?.label}</h2>
              <span className="text-[13px] text-[#747c76]">{searched.length}</span>
            </div>
            <div className="mt-2 overflow-hidden rounded-2xl border border-[#dfe3de] bg-white">
              {searched.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
            </div>
          </section>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.value}>
                <div className="flex items-baseline justify-between gap-4 border-b border-[#cfd5d0] pb-3">
                  <h2 className="text-xl font-semibold">
                    {group.label} <span className="font-normal text-[#858c86]">· {group.restaurants.length}</span>
                  </h2>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-[#dfe3de] bg-white">
                  {group.restaurants.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {!searched.length ? (
          <p className="rounded-2xl border border-[#dfe3de] bg-white px-6 py-8 text-sm text-[#606a63]">
            No restaurants match that search.
          </p>
        ) : null}
      </div>
    </>
  );
}
