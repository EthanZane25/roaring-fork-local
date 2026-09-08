"use client";

import Link from "next/link";
import { Menu, Plus, Search, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrimaryNav } from "@/components/primary-nav";
import { SiteTownControl } from "@/components/site-town-control";

const SECONDARY = [
  ["Blog", "/blog"],
  ["Account", "/account"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#deddd6] bg-[#fbfaf5]/97 backdrop-blur-xl">
      <div className="container-site">
        <div className="flex items-center gap-3 py-2 md:gap-4">
          <div className="shrink-0">
            <Logo compact />
          </div>

          <div className="hidden w-[220px] md:block">
            <SiteTownControl compact />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/search"
              aria-label="Search"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#173f30] hover:bg-[#f0eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b52]"
            >
              <Search size={21} strokeWidth={1.6} />
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#173f30] hover:bg-[#f0eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b52]"
            >
              <UserRound size={22} strokeWidth={1.55} />
            </Link>
          </div>
        </div>

        <div className="pb-2 md:hidden">
          <SiteTownControl compact />
        </div>

        <div className="flex min-h-11 items-center justify-between border-t border-[#ebe8df]">
          <PrimaryNav />

          <div className="hidden items-center gap-1 md:flex">
            {SECONDARY.slice(0, 1).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="px-2.5 py-3 text-[13px] font-medium text-[#667069] hover:text-[#173f30]"
              >
                {label}
              </Link>
            ))}

            <Link
              href="/marketplace/new"
              className="ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#173f30] px-3.5 text-[13px] font-semibold text-white"
            >
              <Plus size={15} /> Post
            </Link>
          </div>

          <details className="relative ml-2 md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-2 text-[13px] font-semibold text-[#465149] [&::-webkit-details-marker]:hidden">
              <Menu size={17} /> More
            </summary>

            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[#dadcd6] bg-white p-2 shadow-xl">
              {SECONDARY.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[#f5f3ed]"
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/search"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[#f5f3ed]"
              >
                <Search size={15} /> Search
              </Link>

              <Link
                href="/marketplace/new"
                className="mt-1 flex items-center gap-2 rounded-lg bg-[#173f30] px-3 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={15} /> Post a listing
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}