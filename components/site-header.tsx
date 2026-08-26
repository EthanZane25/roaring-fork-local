import Link from "next/link";
import { Menu, Search, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";

const primary = [
  ["Eat", "/restaurants"],
  ["Marketplace", "/marketplace"],
  ["Vote", "/vote"],
  ["Events", "/events"],
  ["Jobs", "/jobs"],
  ["Housing", "/housing"]
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f7f4ee]/95 backdrop-blur">
      <div className="container-site flex h-18 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary navigation">
          {primary.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-[#3f4740] transition hover:text-[#163b2d]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-full border border-[#d7d9d2] bg-white" aria-label="Search">
            <Search size={18} />
          </Link>
          <Link href="/account" className="hidden h-10 items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 text-sm font-bold sm:flex">
            <UserRound size={17} /> Account
          </Link>
          <details className="relative lg:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-[#d7d9d2] bg-white" aria-label="Open navigation">
              <Menu size={18} />
            </summary>
            <nav className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-2xl border border-[#d7d9d2] bg-white p-2 shadow-xl" aria-label="Mobile navigation">
              {primary.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#f1f0ea]">{label}</Link>
              ))}
              <Link href="/account" className="rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#f1f0ea]">Account</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
