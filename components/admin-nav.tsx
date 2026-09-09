"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  ["Dashboard", "/admin"],
  ["Restaurants", "/admin/restaurants"],
  ["Merchants", "/admin/merchants"],
  ["Advertising", "/admin/advertising"],
  ["Marketplace", "/admin/marketplace"],
  ["Events", "/admin/events"],
  ["Jobs", "/admin/jobs"],
  ["Housing", "/admin/housing"],
  ["Users", "/admin/users"],
  ["Reports", "/admin/reports"],
  ["Voting", "/admin/votes"],
  ["Blog", "/admin/blog"],
  ["Settings", "/admin/settings"],
  ["System", "/admin/system"]
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-[#d8dad4] bg-[#f4f1e9]/95 backdrop-blur">
      <div className="container-site">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="shrink-0 border-r border-[#d8dad4] pr-4 text-[12px] font-bold uppercase tracking-[0.12em] text-[#173f30]"
          >
            Admin
          </Link>

          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav
              className="flex min-w-max items-center gap-1 py-2"
              aria-label="Administration"
            >
              {ADMIN_LINKS.map(([label, href]) => {
                const active =
                  href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-[13px] font-semibold transition ${
                      active
                        ? "bg-[#173f30] text-white"
                        : "text-[#405047] hover:bg-white hover:text-[#173f30]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            href="/"
            className="hidden shrink-0 text-xs font-semibold text-[#173f30] hover:underline lg:block"
          >
            View site →
          </Link>
        </div>
      </div>
    </div>
  );
}
