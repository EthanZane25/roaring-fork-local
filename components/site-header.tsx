"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrimaryNav } from "@/components/primary-nav";
import { SiteSearch } from "@/components/site-search";
import { SiteTownControl } from "@/components/site-town-control";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dedfd9] bg-white/95 backdrop-blur-md">
      <div className="container-site">
        <div className="flex min-h-[72px] items-center gap-4">
          <Logo />

          <Link
            href="/account"
            className="ml-auto inline-flex h-10 shrink-0 items-center gap-2 px-2 text-[14px] font-medium text-[#242824] hover:text-[#173f30]"
          >
            <span>Account</span>
            <UserRound size={20} strokeWidth={1.6} />
          </Link>
        </div>

        <div className="border-t border-[#ecece8] lg:flex lg:items-center lg:gap-6">
          <PrimaryNav className="min-w-0 flex-1" />

          <div className="flex gap-2 border-t border-[#ecece8] py-2 lg:w-auto lg:shrink-0 lg:border-t-0 lg:py-0">
            <SiteTownControl />
            <div className="min-w-0 flex-1 sm:w-[310px] sm:flex-none">
              <SiteSearch />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
