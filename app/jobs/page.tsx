import Link from "next/link";
import type { Metadata } from "next";
import { TOWNS, getTown } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jobs | Roaring Fork Local",
  description: "Local jobs and people looking for work from Aspen to Rifle."
};

const WORK_TYPES = [
  "Full time",
  "Part time",
  "Seasonal",
  "Contract",
  "Temporary"
] as const;

type JobRow = {
  id: string;
  title: string;
  company: string;
  town_slug: string;
  description: string;
  pay_text: string;
  employment_type: string;
  listing_type: "hiring" | "work_wanted";
  contact_email: string | null;
  contact_phone: string | null;
  apply_url: string | null;
  created_at: string;
};

type JobsSearchParams = {
  town?: string;
  view?: string;
  q?: string;
  type?: string;
  posted?: string;
};

function viewHref(view: "jobs" | "work", town?: string) {
  const params = new URLSearchParams({ view });

  if (town) {
    params.set("town", town);
  }

  return `/jobs?${params.toString()}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export default async function JobsPage({
  searchParams
}: {
  searchParams: Promise<JobsSearchParams>;
}) {
  const params = await searchParams;

  const selectedTown =
    params.town && getTown(params.town) ? params.town : "";

  const view = params.view === "work" ? "work" : "jobs";

  const listingType =
    view === "work" ? "work_wanted" : "hiring";

  const selectedType = WORK_TYPES.includes(
    params.type as (typeof WORK_TYPES)[number]
  )
    ? params.type || ""
    : "";

  const search = (params.q || "").trim();

  const townName = selectedTown
    ? getTown(selectedTown)?.name
    : undefined;

  const liveInventory = hasSupabaseEnv();

  let rows: JobRow[] = [];
  let loadError = false;

  if (liveInventory) {
    const supabase = await createClient();

    let query = supabase
      .from("jobs")
      .select(
        "id,title,company,town_slug,description,pay_text,employment_type,listing_type,contact_email,contact_phone,apply_url,created_at"
      )
      .eq("status", "active")
      .eq("listing_type", listingType)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (selectedTown) {
      query = query.eq("town_slug", selectedTown);
    }

    if (selectedType) {
      query = query.eq("employment_type", selectedType);
    }

    const { data, error } = await query;

    loadError = Boolean(error);
    rows = (data ?? []) as JobRow[];
  }

  const needle = search.toLowerCase();

  const jobs = needle
    ? rows.filter((job) =>
        [
          job.title,
          job.company,
          job.description,
          job.employment_type,
          job.pay_text
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : rows;

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">
          Jobs
        </h1>

        <p className="mt-3 text-[15px] leading-7 text-[#5e665e]">
          {townName
            ? `Local jobs and people looking for work in ${townName}.`
            : "Local jobs and people looking for work from Aspen to Rifle."}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-[#d9dbd5] pb-5">
        <Link
          href={viewHref("jobs", selectedTown)}
          className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition ${
            view === "jobs"
              ? "border-[#173f30] bg-[#173f30] text-white"
              : "border-[#d4d7d1] bg-white text-[#2f342f] hover:border-[#aeb4ad]"
          }`}
        >
          Find a Job
        </Link>

        <Link
          href={viewHref("work", selectedTown)}
          className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition ${
            view === "work"
              ? "border-[#173f30] bg-[#173f30] text-white"
              : "border-[#d4d7d1] bg-white text-[#2f342f] hover:border-[#aeb4ad]"
          }`}
        >
          Looking for Work
        </Link>

        <Link
          href="/jobs/new?kind=hiring"
          className="inline-flex min-h-10 items-center rounded-lg border border-[#b38a28] bg-[#fffdf8] px-4 text-sm font-semibold text-[#173f30] transition hover:bg-[#f7f1df]"
        >
          Post a Job
        </Link>
      </div>

      {params.posted === "1" ? (
        <p className="mt-5 border-l-2 border-[#b38a28] pl-3 text-sm font-medium text-[#3d4b42]">
          Your listing is live.
        </p>
      ) : null}

      <form
        method="get"
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_170px_auto]"
      >
        <input type="hidden" name="view" value={view} />

        <input
          name="q"
          defaultValue={search}
          placeholder={
            view === "work"
              ? "Search skills or experience"
              : "Search jobs or skills"
          }
          className="min-h-11 rounded-lg border border-[#d5d8d2] bg-white px-4 text-sm outline-none focus:border-[#7b8d80]"
        />

        <select
          name="town"
          defaultValue={selectedTown}
          className="min-h-11 rounded-lg border border-[#d5d8d2] bg-white px-3 text-sm outline-none focus:border-[#7b8d80]"
        >
          <option value="">All towns</option>

          {TOWNS.map((town) => (
            <option key={town.slug} value={town.slug}>
              {town.name}
            </option>
          ))}
        </select>

        <select
          name="type"
          defaultValue={selectedType}
          className="min-h-11 rounded-lg border border-[#d5d8d2] bg-white px-3 text-sm outline-none focus:border-[#7b8d80]"
        >
          <option value="">All work types</option>

          {WORK_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button className="min-h-11 rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {view === "work" ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#606860]">
          <span>
            Available local workers and independent professionals.
          </span>

          <Link
            href="/jobs/new?kind=work_wanted"
            className="font-semibold text-[#173f30] hover:underline"
          >
            Post that you&apos;re looking for work →
          </Link>
        </div>
      ) : null}

      <section className="mt-8 border-y border-[#d9dbd5] bg-white">
        {loadError ? (
          <div className="py-10">
            <h2 className="text-[17px] font-semibold">
              Jobs are temporarily unavailable
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#606860]">
              Please try again in a few minutes.
            </p>
          </div>
        ) : jobs.length ? (
          jobs.map((job, index) => {
            const town =
              getTown(job.town_slug)?.name || job.town_slug;

            const contactHref =
              job.apply_url ||
              (job.contact_email
                ? `mailto:${job.contact_email}`
                : null) ||
              (job.contact_phone
                ? `tel:${job.contact_phone.replace(/[^+\d]/g, "")}`
                : null);

            const contactLabel =
              job.apply_url && view === "jobs"
                ? "Apply →"
                : "Contact →";

            return (
              <article
                key={job.id}
                className={`grid gap-3 py-5 sm:grid-cols-[145px_1fr_170px] ${
                  index ? "border-t border-[#e4e5df]" : ""
                }`}
              >
                <div>
                  <p className="text-[13px] font-semibold text-[#667068]">
                    {town}
                  </p>

                  <p className="mt-1 text-[12px] text-[#8a908b]">
                    Posted {formatDate(job.created_at)}
                  </p>
                </div>

                <div>
                  <h2 className="text-[17px] font-semibold text-[#202420]">
                    {job.title}
                  </h2>

                  <p className="mt-1 text-[13px] text-[#6d746e]">
                    {job.company} · {job.employment_type}
                  </p>

                  {job.description ? (
                    <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#596159]">
                      {job.description}
                    </p>
                  ) : null}
                </div>

                <div className="sm:text-right">
                  {job.pay_text ? (
                    <p className="text-[13px] font-medium text-[#4f5a52]">
                      {job.pay_text}
                    </p>
                  ) : null}

                  {contactHref ? (
                    <a
                      href={contactHref}
                      target={job.apply_url ? "_blank" : undefined}
                      rel={job.apply_url ? "noreferrer" : undefined}
                      className="mt-2 inline-flex text-[13px] font-semibold text-[#173f30] hover:underline"
                    >
                      {contactLabel}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="py-10">
            <h2 className="text-[17px] font-semibold">
              {view === "work"
                ? "No one has posted that they’re looking for work yet."
                : "No current job listings yet."}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#606860]">
              {view === "work"
                ? "If you’re available for local work, you can add a simple listing with your skills and contact information."
                : "Local employers can post openings here as they become available."}
            </p>

            <Link
              href={
                view === "work"
                  ? "/jobs/new?kind=work_wanted"
                  : "/jobs/new?kind=hiring"
              }
              className="mt-4 inline-flex text-sm font-semibold text-[#173f30] hover:underline"
            >
              {view === "work"
                ? "Post that you’re looking for work →"
                : "Post a job →"}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
