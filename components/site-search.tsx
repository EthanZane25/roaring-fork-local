"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SiteSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const source = new URL(window.location.href);
    const next = new URL("/search", source.origin);
    if (query.trim()) next.searchParams.set("q", query.trim());
    const town = source.searchParams.get("town") || window.localStorage.getItem("rfl-town");
    if (town) next.searchParams.set("town", town);
    router.push(`${next.pathname}${next.search}`);
  }

  return (
    <form onSubmit={submit} className="h-10 min-w-0 flex-1" role="search">
      <label className="relative block h-full">
        <span className="sr-only">Search Roaring Fork Local</span>
        <Search
          size={17}
          strokeWidth={1.6}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707771]"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Roaring Fork Local..."
          aria-label="Search Roaring Fork Local"
          className="h-full w-full rounded-md border border-[#d8dad4] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[#8a908b] focus:border-[#4f6e5f]"
        />
      </label>
    </form>
  );
}
