import Link from "next/link";
import { Logo } from "@/components/logo";
import { TOWNS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#d8d9d2] bg-[#ece9e1] py-12">
      <div className="container-site grid gap-10 md:grid-cols-[1.1fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#5f675f]">
            One useful local source for dining, deals, jobs, housing, events and community voting from Aspen to Rifle.
          </p>
          <p className="mt-5 text-xs text-[#777f77]">© 2026 Roaring Fork Local</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.15em]">Explore</h3>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href="/restaurants">Restaurants</Link>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/vote">Local voting</Link>
              <Link href="/events">Events</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.15em]">Community</h3>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href="/jobs">Jobs</Link>
              <Link href="/housing">Housing</Link>
              <Link href="/marketplace/new">Post a classified</Link>
              <Link href="/account">Account</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.15em]">Towns</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {TOWNS.map((town) => <Link key={town.slug} href={`/${town.slug}`}>{town.name}</Link>)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
