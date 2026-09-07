"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrimaryNav } from "@/components/primary-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e2da] bg-[#fbfaf5]/98 backdrop-blur-xl">
      <div className="container-site">
        <div className="flex min-h-[108px] items-center gap-6 lg:min-h-[116px]">
          <Logo />

          <PrimaryNav className="ml-auto hidden min-w-0 md:block" />

          <Link
            href="/marketplace/new"
            className="hidden shrink-0 whitespace-nowrap px-2 py-3 text-[14px] font-medium text-[#173f30] lg:inline-flex"
          >
            Post a listing
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="grid h-11 w-11 shrink-0 place-items-center text-[#173f30]"
          >
            <UserRound size={27} strokeWidth={1.45} />
          </Link>
        </div>

        <div className="border-t border-[#ece9e1] md:hidden">
          <PrimaryNav />
        </div>
      </div>
    </header>
  );
}
