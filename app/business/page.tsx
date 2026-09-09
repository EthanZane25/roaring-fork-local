import Link from "next/link";
import {
  BadgePercent,
  BriefcaseBusiness,
  CreditCard,
  Megaphone,
  Store
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTown } from "@/lib/constants";

export const metadata = {
  title: "For Business | Roaring Fork Local",
  description:
    "Manage your business, post deals, hire locally and advertise on Roaring Fork Local."
};

export default async function BusinessPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/business");
  }

  const { data: business } = await supabase
    .from("merchant_businesses")
    .select("id,business_name,business_type,town_slug,address,status")
    .eq("owner_id", user.id)
    .maybeSingle();

  const approved = business?.status === "approved";

  const tools = [
    {
      title: "Deals",
      description: "Create and manage offers for local customers.",
      href: "/merchant",
      icon: BadgePercent
    },
    {
      title: "Jobs",
      description: "Post local openings and manage your hiring.",
      href: "/jobs/new?kind=hiring",
      icon: BriefcaseBusiness
    },
    {
      title: "Advertising",
      description: "Buy featured placement across Roaring Fork Local.",
      href: "/business/advertising",
      icon: Megaphone
    },
    {
      title: "Business Profile",
      description: "Manage your business information and location.",
      href: "/merchant",
      icon: Store
    },
    {
      title: "Billing",
      description: "See advertising purchases and active promotions.",
      href: "/business/billing",
      icon: CreditCard
    }
  ];

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[.15em] text-[#9a7422]">
            Roaring Fork Local
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">
            For Business
          </h1>

          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">
            Post deals, hire locally, promote your business and manage everything in one place.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold text-[#173f30] hover:underline"
        >
          View site →
        </Link>
      </div>

      {!business ? (
        <section className="mt-8 rounded-xl border border-[#dddcd5] bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">
            Add your business
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#606860]">
            Register your business once, then use the business dashboard to post deals,
            jobs and advertising.
          </p>

          <Link
            href="/merchant"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white"
          >
            Add my business
          </Link>
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-[#dddcd5] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[.13em] text-[#7b827c]">
                Your business
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                {business.business_name}
              </h2>

              <p className="mt-1 text-sm text-[#687069]">
                {getTown(business.town_slug)?.name || business.town_slug}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                approved
                  ? "bg-[#e7f0e9] text-[#28553c]"
                  : "bg-[#f5eedb] text-[#7a6229]"
              }`}
            >
              {approved ? "Approved" : "Pending approval"}
            </span>
          </div>

          {!approved ? (
            <p className="mt-5 border-l-2 border-[#b38a28] pl-3 text-sm leading-6 text-[#646960]">
              You can manage your account now. Deals and paid advertising become available
              after the business is approved.
            </p>
          ) : null}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Business tools
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group rounded-xl border border-[#dddcd5] bg-white p-5 transition hover:border-[#b8beb7] hover:shadow-sm"
              >
                <Icon
                  size={22}
                  strokeWidth={1.7}
                  className="text-[#173f30]"
                />

                <h3 className="mt-4 text-[17px] font-semibold">
                  {tool.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#656d66]">
                  {tool.description}
                </p>

                <span className="mt-4 inline-flex text-sm font-semibold text-[#173f30]">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
