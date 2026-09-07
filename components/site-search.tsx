"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SiteSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = new URL(window.location.href);
    const next = new URL("/search", source.origin);
    const trimmed = String(form.get("q") || "").trim();

    if (trimmed) next.searchParams.set("q", trimmed);
    const town = source.searchParams.get("town") || window.localStorage.getItem("rfl-town");
    if (town) next.searchParams.set("town", town);

    router.push(`${next.pathname}${next.search}`);
  }

  return (
    <form onSubmit={submit} className="min-w-0 flex-1" role="search">
      <label className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-[#d8ddd8] bg-white px-3.5 transition focus-within:border-[#2f6b52] focus-within:shadow-[0_0_0_3px_rgba(47,107,82,0.08)] ${compact ? "h-10" : "h-11"}`}>
        <span className="sr-only">Search Roaring Fork Local</span>
        <Search size={17} strokeWidth={1.8} className="shrink-0 text-[#707a73]" aria-hidden="true" />
        <input
          name="q"
          placeholder="Search tacos, Honda, open mic…"
          aria-label="Search Roaring Fork Local"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[#1d231f] outline-none placeholder:text-[#8b938d]"
        />
      </label>
    </form>
  );
}
