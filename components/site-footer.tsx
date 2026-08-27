import Link from "next/link";
import { Logo } from "@/components/logo";
import { TOWNS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-[#d8dad4] bg-[#f1f0ec]">
      <div className="container-site py-9">
        <div className="flex flex-col gap-4 border-b border-[#d4d6d0] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-[#616761]">One useful local source from Aspen to Rifle.</p>
          </div>
          <p className="text-xs text-[#7b817c]">© 2026 Roaring Fork Local</p>
        </div>

        <div className="grid gap-8 pt-7 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold">Explore</h3>
            <div className="mt-3 grid gap-2 text-sm text-[#555b56]">
              <Link href="/restaurants">Restaurants</Link>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/vote">Vote</Link>
              <Link href="/events">Events</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Community</h3>
            <div className="mt-3 grid gap-2 text-sm text-[#555b56]">
              <Link href="/jobs">Jobs</Link>
              <Link href="/housing">Housing</Link>
              <Link href="/marketplace/new">Post a classified</Link>
              <Link href="/account">Account</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Towns</h3>
            <div className="mt-3 grid gap-2 text-sm text-[#555b56]">
              {TOWNS.map((town) => <Link key={town.slug} href={`/?town=${town.slug}`} className="w-fit">{town.name}</Link>)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
