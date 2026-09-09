"use client";

import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  PRIMARY_NAV,
  PrimaryNav
} from "@/components/primary-nav";

export function SiteHeader() {
  return (
    <header className="relative z-50 border-b border-[#e3dfd5] bg-[#faf7ef]">
      <div className="container-site flex min-h-[132px] items-center">
        <div className="shrink-0">
          <Logo />
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <PrimaryNav />

          <Link
            href="/marketplace/new"
            className="ml-2 whitespace-nowrap px-3 py-3 text-[14px] font-medium text-[#173f30] transition hover:text-[#0d2d20]"
          >
            Post a listing
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="ml-1 grid h-11 w-11 place-items-center text-[#173f30]"
          >
            <UserRound
              size={30}
              strokeWidth={1.35}
            />
          </Link>
        </div>

        <details className="relative ml-auto md:hidden">
          <summary
            aria-label="Open navigation menu"
            className="grid h-11 w-11 cursor-pointer list-none place-items-center text-[#173f30] [&::-webkit-details-marker]:hidden"
          >
            <Menu size={25} />
          </summary>

          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[#ddd9ce] bg-[#faf7ef] p-2 shadow-xl">
            {PRIMARY_NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-md px-4 py-3 text-sm font-medium hover:bg-[#f0ece2]"
              >
                {label}
              </Link>
            ))}

            <Link
              href="/account"
              className="block rounded-md px-4 py-3 text-sm font-medium hover:bg-[#f0ece2]"
            >
              Account
            </Link>

            <Link
              href="/marketplace/new"
              className="block rounded-md px-4 py-3 text-sm font-semibold text-[#173f30] hover:bg-[#f0ece2]"
            >
              Post a listing
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
