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
    return CUISINES.filter((item) => item.value).map((item) => ({
      ...item,
      restaurants: searched.filter((restaurant) => restaurant.cuisine === item.value)
    })).filter((group) => group.restaurants.length > 0);
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
        <label className="relative block">
          <span className="sr-only">Search within restaurants</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#777d77]" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search within restaurants"
            className="h-11 w-full border border-[#cfd2cc] bg-white pl-9 pr-9 text-sm outline-none focus:border-[#37644f]"
          />
          {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777d77]" aria-label="Clear restaurant search"><X size={16} /></button> : null}
        </label>
      </div>

      <div className="sticky top-[58px] z-20 mt-6 border-y border-[#d8dad4] bg-[#fbfaf7]/96 py-3 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CUISINES.map((item) => {
            const active = item.value === validCuisine;
            return (
              <Link
                key={item.value || "all"}
                href={cuisineHref(item.value)}
                className={`shrink-0 border px-3.5 py-2 text-sm font-medium ${active ? "border-[#173f30] bg-[#173f30] text-white" : "border-[#d4d7d0] bg-white text-[#4f5651] hover:border-[#9ca7a0]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        {validCuisine ? (
          <section>
            <div className="flex items-baseline justify-between gap-4 border-b border-[#cfd2cc] pb-3">
              <h2 className="text-xl font-semibold">{CUISINES.find((item) => item.value === validCuisine)?.label}</h2>
              <span className="text-[13px] text-[#747b76]">{searched.length}</span>
            </div>
            <div className="bg-white">{searched.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}</div>
          </section>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.value}>
                <div className="flex items-baseline justify-between gap-4 border-b border-[#cfd2cc] pb-3">
                  <h2 className="text-xl font-semibold">{group.label} <span className="font-normal text-[#858b86]">· {group.restaurants.length}</span></h2>
                </div>
                <div className="bg-white">{group.restaurants.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}</div>
              </section>
            ))}
          </div>
        )}
        {!searched.length ? <p className="border-y border-[#dfe1db] py-7 text-sm text-[#606760]">No restaurants match that search.</p> : null}
      </div>
    </>
  );
}
