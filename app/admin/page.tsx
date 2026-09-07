import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const LINKS = [
  ["Restaurants", "/admin/restaurants", "Directory, verification and publishing"],
  ["Advertising", "/admin/advertising", "Advertisers, campaigns and placements"],
  ["Marketplace", "/admin/marketplace", "Moderate local listings"],
  ["Events", "/admin/events", "Create and publish events"],
  ["Jobs", "/admin/jobs", "Create and manage jobs"],
  ["Housing", "/admin/housing", "Create and manage housing"],
  ["Users", "/admin/users", "Roles and account oversight"],
  ["Reports", "/admin/reports", "Reports and review moderation"],
  ["Voting", "/admin/votes", "Vote security and held votes"],
  ["Blog", "/admin/blog", "Posts and suggestions"],
  ["Settings", "/admin/settings", "Branding, homepage, features and SEO"],
  ["System", "/admin/system", "Audit log, errors and metrics"]
] as const;

export default async function AdminPage() {
  if (!hasSupabaseEnv()) {
    return <main className="container-site py-14"><p className="eyebrow">Administration</p><h1 className="mt-3 text-4xl font-semibold">Admin control center</h1><div className="card mt-8 p-7 text-sm text-[#5e665e]">Connect Supabase to activate role-protected administration.</div></main>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).single();
  if (!profile || !["admin","moderator"].includes(profile.role)) redirect("/");

  const [restaurants, listings, users, events, jobs, housing, advertisers, campaigns, heldVotes, reports, heldReviews] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("housing_listings").select("*", { count: "exact", head: true }),
    supabase.from("advertisers").select("*", { count: "exact", head: true }),
    supabase.from("ad_campaigns").select("*", { count: "exact", head: true }),
    supabase.from("restaurant_votes").select("*", { count: "exact", head: true }).eq("status", "held"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("restaurant_reviews").select("*", { count: "exact", head: true }).eq("status", "held")
  ]);

  const stats = [
    ["Restaurants", restaurants.count ?? 0], ["Marketplace", listings.count ?? 0], ["Users", users.count ?? 0],
    ["Events", events.count ?? 0], ["Jobs", jobs.count ?? 0], ["Housing", housing.count ?? 0],
    ["Advertisers", advertisers.count ?? 0], ["Campaigns", campaigns.count ?? 0], ["Held votes", heldVotes.count ?? 0],
    ["Open reports", reports.count ?? 0], ["Held reviews", heldReviews.count ?? 0]
  ];

  return (
    <main className="container-site py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Control center</h1>
          <p className="mt-2 text-sm text-[#657068]">Signed in as {profile.display_name || user.email || "administrator"} · {profile.role}</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-[#173f30] hover:underline">View public site →</Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => <div key={label} className="card p-4"><p className="text-[12px] font-semibold uppercase tracking-[.08em] text-[#6b746e]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(([label, href, description]) => (
          <Link key={href} href={href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <h2 className="text-[17px] font-semibold">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-[#69716b]">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
