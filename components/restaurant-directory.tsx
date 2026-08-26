"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { getTown, TOWNS, titleize } from "@/lib/constants";
import { FoodFinder } from "@/components/food-finder";
import { RestaurantRow } from "@/components/restaurant-row";
import { SponsoredRestaurantCard } from "@/components/sponsored-restaurant-card";

type SortOption = "recommended" | "votes" | "name" | "price-low" | "price-high" | "verified";

type RestaurantDirectoryProps = {
  restaurants: Restaurant[];
  initialTown?: string;
};

const PAGE_SIZE = 24;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function verifiedTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function RestaurantDirectory({ restaurants, initialTown = "" }: RestaurantDirectoryProps) {
  const [query, setQuery] = useState("");
  const [town, setTown] = useState(initialTown);
  const [foodType, setFoodType] = useState("");
  const [meal, setMeal] = useState("");
  const [sort, setSort] = useState<SortOption>("name");
  const [openNow, setOpenNow] = useState(false);
  const [price, setPrice] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [finderOpen, setFinderOpen] = useState(false);

  const foodTypes = useMemo(
    () => Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.cuisines))).sort(),
    [restaurants]
  );

  const meals = useMemo(
    () => Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.meals))).sort(),
    [restaurants]
  );

  const nameSuggestions = useMemo(() => {
    const needle = normalize(query);
    if (needle.length < 2) return [];
    return restaurants
      .filter((restaurant) => restaurant.name.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [query, restaurants]);

  const filteredRestaurants = useMemo(() => {
    const needle = normalize(query);
    const next = restaurants.filter((restaurant) => {
      const searchable = [
        restaurant.name,
        restaurant.address,
        ...restaurant.cuisines,
        ...restaurant.meals,
        ...restaurant.tags
      ]
        .join(" ")
        .toLowerCase();

      if (needle && !searchable.includes(needle)) return false;
      if (town && restaurant.town !== town) return false;
      if (foodType && !restaurant.cuisines.includes(foodType)) return false;
      if (meal && !restaurant.meals.includes(meal)) return false;
      if (openNow && restaurant.openNow !== true) return false;
      if (price && restaurant.priceLevel !== price) return false;
      return true;
    });

    return next.toSorted((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-low") return a.priceLevel - b.priceLevel || a.name.localeCompare(b.name);
      if (sort === "price-high") return b.priceLevel - a.priceLevel || a.name.localeCompare(b.name);
      if (sort === "verified") return verifiedTimestamp(b.verifiedAt) - verifiedTimestamp(a.verifiedAt);
      return b.localVotes - a.localVotes || a.name.localeCompare(b.name);
    });
  }, [restaurants, query, town, foodType, meal, sort, openNow, price]);

  const sponsoredRestaurants = useMemo(
    () => filteredRestaurants.filter((restaurant) => restaurant.isAdvertiser && Boolean(restaurant.imageUrl)),
    [filteredRestaurants]
  );

  const visible = filteredRestaurants.slice(0, visibleCount);
  const hasActiveFilters = Boolean(query || town !== initialTown || foodType || meal || openNow || price);

  function resetFilters() {
    setQuery("");
    setTown(initialTown);
    setFoodType("");
    setMeal("");
    setSort("name");
    setOpenNow(false);
    setPrice(0);
    setVisibleCount(PAGE_SIZE);
  }

  function resetPage() {
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      <section className="mt-7 border border-[#d9dcd5] bg-white p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_190px_220px_180px]">
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold text-[#555d57]">Restaurant name</label>
            <Search className="pointer-events-none absolute left-3 top-[37px] -translate-y-1/2 text-[#777d77]" size={17} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Search restaurants"
              className="h-[44px] w-full border border-[#cfd2cc] bg-white pl-9 pr-9 text-sm outline-none focus:border-[#37644f]"
              aria-label="Search restaurants"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-[37px] -translate-y-1/2 text-[#777d77]"
                aria-label="Clear restaurant search"
              >
                <X size={16} />
              </button>
            ) : null}

            {nameSuggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-[70px] z-20 border border-[#d5d8d1] bg-white shadow-[0_8px_24px_rgba(24,31,27,0.08)]">
                {nameSuggestions.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.slug}`}
                    className="flex items-center justify-between border-b border-[#eceee9] px-4 py-3 text-sm last:border-0 hover:bg-[#f7f7f4]"
                  >
                    <span className="font-medium">{restaurant.name}</span>
                    <span className="text-xs text-[#737973]">{getTown(restaurant.town)?.name}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <FilterSelect
            label="Town"
            value={town}
            onChange={(value) => {
              setTown(value);
              resetPage();
            }}
            options={[{ value: "", label: "All towns" }, ...TOWNS.map((item) => ({ value: item.slug, label: item.name }))]}
          />

          <FilterSelect
            label="What kind of food?"
            value={foodType}
            onChange={(value) => {
              setFoodType(value);
              resetPage();
            }}
            options={[{ value: "", label: "All food types" }, ...foodTypes.map((item) => ({ value: item, label: titleize(item) }))]}
          />

          <FilterSelect
            label="Meal"
            value={meal}
            onChange={(value) => {
              setMeal(value);
              resetPage();
            }}
            options={[{ value: "", label: "Any meal" }, ...meals.map((item) => ({ value: item, label: titleize(item) }))]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eceee9] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className="inline-flex h-9 items-center gap-2 border border-[#cfd2cc] bg-white px-3 text-xs font-medium hover:bg-[#f7f7f4]"
              aria-expanded={showMore}
            >
              <SlidersHorizontal size={14} /> More filters <ChevronDown size={14} className={showMore ? "rotate-180" : ""} />
            </button>
            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-[#315e49] hover:underline">
                Clear filters
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setFinderOpen(true)}
            className="bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3225]"
          >
            Can’t decide where to eat? Help me choose
          </button>
        </div>

        {showMore ? (
          <div className="mt-4 grid gap-3 border-t border-[#eceee9] pt-4 sm:grid-cols-3">
            <FilterSelect
              label="Price"
              value={String(price)}
              onChange={(value) => {
                setPrice(Number(value));
                resetPage();
              }}
              options={[
                { value: "0", label: "Any price" },
                { value: "1", label: "$" },
                { value: "2", label: "$$" },
                { value: "3", label: "$$$" },
                { value: "4", label: "$$$$" }
              ]}
            />

            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(value) => setSort(value as SortOption)}
              options={[
                { value: "name", label: "Name A–Z" },
                { value: "recommended", label: "Most local votes" },
                { value: "price-low", label: "Price: low to high" },
                { value: "price-high", label: "Price: high to low" },
                { value: "verified", label: "Recently verified" }
              ]}
            />

            <label className="grid gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#59605a]">Availability</span>
              <span className="flex h-[44px] items-center gap-2 border border-[#cfd2cc] bg-white px-3 text-sm">
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(event) => {
                    setOpenNow(event.target.checked);
                    resetPage();
                  }}
                />
                Open now only
              </span>
            </label>
          </div>
        ) : null}
      </section>

      {sponsoredRestaurants.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Featured restaurants</h2>
              <p className="mt-1 text-xs text-[#6b716c]">Paid restaurant advertisements are labeled Sponsored.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sponsoredRestaurants.slice(0, 3).map((restaurant) => (
              <SponsoredRestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#cfd2cc] pb-3">
          <div>
            <h2 className="text-xl font-semibold">All restaurants</h2>
            <p className="mt-1 text-xs text-[#6b716c]">{filteredRestaurants.length.toLocaleString()} matching restaurants · Free listings stay text-only.</p>
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="bg-white">
            {visible.map((restaurant) => <RestaurantRow key={restaurant.id} restaurant={restaurant} />)}
          </div>
        ) : (
          <div className="border-b border-[#dfe1db] py-10 text-sm text-[#606760]">
            No restaurants match those filters. <button type="button" onClick={resetFilters} className="font-semibold text-[#315e49] hover:underline">Clear filters</button>
          </div>
        )}

        {visibleCount < filteredRestaurants.length ? (
          <div className="border-t border-[#dfe1db] pt-5 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="border border-[#bcc1ba] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f5f5f2]"
            >
              Show 24 more
            </button>
          </div>
        ) : null}
      </section>

      <FoodFinder restaurants={restaurants} open={finderOpen} onClose={() => setFinderOpen(false)} />
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-semibold text-[#59605a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[44px] w-full border border-[#cfd2cc] bg-white px-3 text-sm outline-none focus:border-[#37644f]"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
