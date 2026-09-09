import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarPlus,
  Flag,
  Megaphone,
  Plus,
  ShieldAlert,
  Store,
  UsersRound
} from "lucide-react";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false
  }
};

const SECTIONS = [
  ["Restaurants", "/admin/restaurants", "Directory, verification and publishing"],
  ["Merchants", "/admin/merchants", "Business approvals and Valley Drop access"],
  ["Advertising", "/admin/advertising", "Advertisers, campaigns and placements"],
  ["Marketplace", "/admin/marketplace", "Moderate local listings"],
  ["Events", "/admin/events", "Create and publish events"],
  ["Jobs", "/admin/jobs", "Create and manage jobs"],
  ["Housing", "/admin/housing", "Create and manage housing"],
  ["Users", "/admin/users", "Roles and account oversight"],
  ["Reports", "/admin/reports", "Reports and moderation"],
  ["Voting", "/admin/votes", "Vote security and held votes"],
  ["Blog", "/admin/blog", "Posts and suggestions"],
  ["Settings", "/admin/settings", "Branding, features and SEO"],
  ["System", "/admin/system", "Audit log, errors and metrics"]
] as const;

export default async function AdminPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="container-site py-14">
        <p className="eyebrow">Administration</p>

        <h1 className="mt-3 text-4xl font-semibold">
          Admin control center
        </h1>

        <div className="card mt-8 p-7 text-sm text-[#5e665e]">
          Connect Supabase to activate role-protected administration.
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/");
  }

  const [
    restaurants,
    listings,
    heldListings,
    users,
    events,
    jobs,
    housing,
    advertisers,
    campaigns,
    heldVotes,
    reports,
    heldReviews
  ] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "held"),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("events")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("housing_listings")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("advertisers")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("ad_campaigns")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("restaurant_votes")
      .select("*", { count: "exact", head: true })
      .eq("status", "held"),

    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),

    supabase
      .from("restaurant_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "held")
  ]);

  const attention = [
    {
      label: "Marketplace review",
      value: heldListings.count ?? 0,
      href: "/admin/marketplace",
      description: "Listings waiting for approval",
      icon: Store
    },
    {
      label: "Open reports",
      value: reports.count ?? 0,
      href: "/admin/reports",
      description: "User reports needing review",
      icon: Flag
    },
    {
      label: "Held votes",
      value: heldVotes.count ?? 0,
      href: "/admin/votes",
      description: "Votes held by security checks",
      icon: ShieldAlert
    },
    {
      label: "Held reviews",
      value: heldReviews.count ?? 0,
      href: "/admin/reports",
      description: "Restaurant reviews awaiting moderation",
      icon: AlertTriangle
    }
  ];

  const totals = [
    ["Restaurants", restaurants.count ?? 0],
    ["Marketplace", listings.count ?? 0],
    ["Users", users.count ?? 0],
    ["Events", events.count ?? 0],
    ["Jobs", jobs.count ?? 0],
    ["Housing", housing.count ?? 0],
    ["Advertisers", advertisers.count ?? 0],
    ["Campaigns", campaigns.count ?? 0]
  ];

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">
            Control center
          </h1>

          <p className="mt-2 text-sm text-[#657068]">
            Signed in as{" "}
            {profile.display_name ||
              user.email ||
              "administrator"}{" "}
            · {profile.role}
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold text-[#173f30] hover:underline lg:hidden"
        >
          View public site →
        </Link>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#8b6b22]">
              Needs attention
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Moderation queue
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attention.map(
            ({
              label,
              value,
              href,
              description,
              icon: Icon
            }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl border border-[#d9ddd7] bg-white p-5 transition hover:border-[#aebbb2] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon
                    size={20}
                    className="text-[#173f30]"
                  />

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      Number(value) > 0
                        ? "bg-[#f5e8df] text-[#8a482d]"
                        : "bg-[#e7efe9] text-[#366047]"
                    }`}
                  >
                    {value}
                  </span>
                </div>

                <h3 className="mt-5 text-[16px] font-semibold">
                  {label}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#6b746d]">
                  {description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#173f30]">
                  Review
                  <ArrowRight size={12} />
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#8b6b22]">
          Quick actions
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/restaurants/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={15} />
            Add restaurant
          </Link>

          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d3d8d2] bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <CalendarPlus size={15} />
            Add event
          </Link>

          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d3d8d2] bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <UsersRound size={15} />
            Add job
          </Link>

          <Link
            href="/admin/advertising"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d3d8d2] bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <Megaphone size={15} />
            Add advertiser
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#8b6b22]">
          Site totals
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {totals.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[#dedfd9] bg-white p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[.07em] text-[#737b75]">
                {label}
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Building2
            size={18}
            className="text-[#173f30]"
          />

          <h2 className="text-2xl font-semibold">
            Manage the site
          </h2>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map(
            ([label, href, description]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-[#dedfd9] bg-white p-5 transition hover:border-[#b9c3bb] hover:shadow-sm"
              >
                <h3 className="text-[16px] font-semibold">
                  {label}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#69716b]">
                  {description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#173f30]">
                  Manage
                  <ArrowRight size={12} />
                </span>
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  );
}
