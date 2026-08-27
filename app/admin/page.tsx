import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="container-site py-14">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-4xl font-semibold">Admin dashboard</h1>
        <div className="card mt-8 p-7 text-sm leading-6 text-[#5e665e]">Connect Supabase to activate role-protected administration. The database schema includes admin and moderator roles.</div>
      </main>
    );
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).single();
  if (!profile || !["admin","moderator"].includes(profile.role)) redirect("/");

  const [restaurants, listings, users, votes, reports, heldVotes, suggestions] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status","open"),
    supabase.from("votes").select("*", { count: "exact", head: true }).eq("status","held"),
    supabase.from("blog_suggestions").select("*", { count: "exact", head: true }).eq("status","new")
  ]);
  const stats = [
    ["Restaurants", restaurants.count ?? 0],
    ["Marketplace", listings.count ?? 0],
    ["Users", users.count ?? 0],
    ["Votes", votes.count ?? 0],
    ["Open reports", reports.count ?? 0],
    ["Held votes", heldVotes.count ?? 0],
    ["New suggestions", suggestions.count ?? 0]
  ];

  return (
    <main className="container-site py-14">
      <p className="eyebrow">Administration</p>
      <h1 className="mt-3 text-4xl font-semibold">Operations dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {stats.map(([label, value]) => <div key={label} className="card p-5"><p className="text-sm font-bold text-[#687068]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/restaurants" className="rounded-md bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white">Manage restaurants</Link>
        <Link href="/admin/blog" className="rounded-md border border-[#cfd2cb] bg-white px-5 py-3 text-sm font-semibold">Blog & suggestions</Link>
        <Link href="/admin/votes" className="rounded-md border border-[#cfd2cb] bg-white px-5 py-3 text-sm font-semibold">Vote security</Link>
      </div>
    </main>
  );
}
