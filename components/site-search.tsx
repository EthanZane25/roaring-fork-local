"use client";

import { FormEvent, useState } from "react";

export function SiteSearch() {
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const source = new URL(window.location.href);
    const next = new URL("/search", source.origin);
    if (query.trim()) next.searchParams.set("q", query.trim());
    const town = source.searchParams.get("town");
    if (town) next.searchParams.set("town", town);
    window.location.assign(`${next.pathname}${next.search}`);
  }

  return (
    <form onSubmit={submit} className="h-9 min-w-0 flex-1" role="search">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        aria-label="Search Roaring Fork Local"
        className="h-full w-full border border-[#d8dad4] bg-white px-3 text-sm outline-none placeholder:text-[#8a908b] focus:border-[#4f6e5f]"
      />
    </form>
  );
}
