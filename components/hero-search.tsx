"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full items-stretch border border-[#cfd2cb] bg-white">
      <Search className="ml-4 self-center text-[#727873]" size={18} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-[15px] outline-none"
        placeholder="Search restaurants, things for sale, jobs, events..."
        aria-label="Search Roaring Fork Local"
      />
      <button className="bg-[#173f30] px-5 text-sm font-semibold text-white hover:bg-[#0f3225]">
        Search
      </button>
    </form>
  );
}
