import Link from "next/link";
import { Logo } from "@/components/logo";
import { TOWNS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#dedfd9] bg-[#f2f0e9]">
      <div className="container-site py-10 sm:py-12">
        <div className="grid gap-9 lg:grid-cols-[1.25fr_.75fr_.75fr_1fr]">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#5f675f]">
              Restaurants, local classifieds, events, jobs, housing and community voting from Aspen to Rifle.
            </p>
            <p className="mt-5 text-xs text-[#7c827d]">© 2026 Roaring Fork Local</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#6d746f]">Explore</h3>
            <div className="mt-4 grid gap-2.5 text-sm text-[#3f4741]">
              <Link href="/restaurants">Restaurants</Link>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/events">Events</Link>
              <Link href="/vote">Vote</Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#6d746f]">Community</h3>
            <div className="mt-4 grid gap-2.5 text-sm text-[#3f4741]">
              <Link href="/jobs">Jobs</Link>
              <Link href="/housing">Housing</Link>
              <Link href="/marketplace/new">Post a listing</Link>
              <Link href="/account">Account</Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#6d746f]">Towns</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-[#3f4741]">
              {TOWNS.map((town) => (
                <Link key={town.slug} href={`/?town=${town.slug}`} className="w-fit">
                  {town.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
