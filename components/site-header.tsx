"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { PrimaryNav } from "@/components/primary-nav";
import { SiteSearch } from "@/components/site-search";
import { SiteTownControl } from "@/components/site-town-control";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="border-b border-[#dedfd9] bg-white">
      <div className="container-site">
        <div className="flex min-h-[58px] items-center gap-4 py-2">
          <Logo />

          <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
            <SiteTownControl />
            <div className="w-[210px]">
              <SiteSearch />
            </div>
            <Link
              href="/account"
              className="inline-flex h-9 shrink-0 items-center px-2 text-[13px] font-medium text-[#3f4540] hover:text-[#173f30]"
            >
              Account
            </Link>
          </div>

          <Link
            href="/account"
            className="ml-auto inline-flex h-9 items-center px-2 text-sm font-medium text-[#3f4540] md:hidden"
          >
            Account
          </Link>
        </div>

        <div className="flex gap-2 border-t border-[#ecece8] py-2 md:hidden">
          <SiteTownControl />
          <SiteSearch />
        </div>

        {!isHome ? (
          <div className="border-t border-[#ecece8]">
            <PrimaryNav />
          </div>
        ) : null}
      </div>
    </header>
  );
}
