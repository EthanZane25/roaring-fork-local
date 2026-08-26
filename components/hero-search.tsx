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
    <form onSubmit={submit} className="mx-auto mt-8 flex max-w-2xl items-center rounded-full border border-black/10 bg-white p-2 shadow-xl shadow-black/5">
      <Search className="ml-3 text-[#6b746c]" size={19} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none"
        placeholder="Search restaurants, classifieds, jobs, events..."
        aria-label="Search Roaring Fork Local"
      />
      <button className="rounded-full bg-[#163b2d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f2c21]">
        Search
      </button>
    </form>
  );
}
