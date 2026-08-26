import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { getTown } from "@/lib/constants";

export const metadata = { title: "Manage Restaurants", robots: { index: false, follow: false } };

export default async function AdminRestaurantsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin");
  const { data: restaurants } = await ctx.supabase.from("restaurants").select("id,name,slug,town_slug,published,verified_at,is_advertiser").order("name");

  return (
    <main className="container-site py-12">
      <div className="flex items-end justify-between gap-4">
        <div><p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Restaurants</h1></div>
        <Link href="/admin/restaurants/new" className="rounded-md bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white">Add restaurant</Link>
      </div>
      <div className="card mt-8 overflow-hidden">
        {(restaurants ?? []).map((restaurant) => (
          <Link key={restaurant.id} href={`/admin/restaurants/${restaurant.id}`} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#e1e2dc] p-5 last:border-0 hover:bg-[#f7f7f2]">
            <div><strong>{restaurant.name}</strong><p className="mt-1 text-xs text-[#687068]">{getTown(restaurant.town_slug)?.name} · /restaurants/{restaurant.slug}</p></div>
            <div className="flex items-center gap-2">{restaurant.is_advertiser ? <span className="border border-[#d8c7b3] bg-[#fbf6ee] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a5a31]">Advertiser</span> : null}<span className={`px-3 py-1 text-xs font-semibold ${restaurant.published ? "bg-[#e5f1e8] text-[#24553a]" : "bg-[#eeeae3] text-[#706b62]"}`}>{restaurant.published ? "Published" : "Draft"}</span></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
