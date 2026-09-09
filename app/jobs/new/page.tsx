import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TOWNS } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createJobListing } from "./actions";

export const metadata: Metadata = {
  title: "Post a Job | Roaring Fork Local",
  robots: { index: false, follow: true }
};

const WORK_TYPES = [
  "Full time",
  "Part time",
  "Seasonal",
  "Contract",
  "Temporary"
] as const;

export default async function NewJobPage({
  searchParams
}: {
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const params = await searchParams;
  const kind =
    params.kind === "work_wanted" ? "work_wanted" : "hiring";

  const lookingForWork = kind === "work_wanted";

  if (!hasSupabaseEnv()) {
    return (
      <main className="container-site max-w-3xl py-12">
        <h1 className="text-4xl font-semibold tracking-[-.03em]">
          {lookingForWork ? "Looking for Work" : "Post a Job"}
        </h1>
        <p className="mt-4 text-[#5f675f]">
          Posting will be available when the site is connected to its live services.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/jobs/new?kind=${kind}`)}`
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const inputClass =
    "min-h-11 rounded-lg border border-[#d5d8d2] bg-white px-4 text-sm outline-none focus:border-[#7b8d80]";

  return (
    <main className="container-site max-w-3xl py-10 sm:py-12">
      <Link
        href="/jobs"
        className="text-sm font-semibold text-[#173f30] hover:underline"
      >
        ← Back to Jobs
      </Link>

      <h1 className="mt-5 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">
        {lookingForWork ? "Looking for Work" : "Post a Job"}
      </h1>

      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">
        {lookingForWork
          ? "Tell local employers what kind of work you’re looking for and how to reach you."
          : "Add a local opening with the information people need to decide whether it’s a good fit."}
      </p>

      <div className="mt-7 flex gap-2 border-b border-[#d9dbd5] pb-5">
        <Link
          href="/jobs/new?kind=hiring"
          className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold ${
            !lookingForWork
              ? "border-[#173f30] bg-[#173f30] text-white"
              : "border-[#d4d7d1] bg-white"
          }`}
        >
          Post a Job
        </Link>

        <Link
          href="/jobs/new?kind=work_wanted"
          className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold ${
            lookingForWork
              ? "border-[#173f30] bg-[#173f30] text-white"
              : "border-[#d4d7d1] bg-white"
          }`}
        >
          Looking for Work
        </Link>
      </div>

      {params.error ? (
        <p className="mt-5 border-l-2 border-[#a86146] pl-3 text-sm font-medium text-[#704a3d]">
          {params.error}
        </p>
      ) : null}

      <form action={createJobListing} className="mt-7 grid gap-5">
        <input type="hidden" name="listingType" value={kind} />

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-semibold">
              {lookingForWork
                ? "What kind of work are you looking for?"
                : "Job title"}
            </span>

            <input
              name="title"
              required
              maxLength={100}
              className={inputClass}
              placeholder={
                lookingForWork
                  ? "Experienced carpenter looking for local work"
                  : "Line cook"
              }
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              {lookingForWork ? "Your name" : "Business or organization"}
            </span>

            <input
              name="company"
              required
              maxLength={100}
              defaultValue={
                lookingForWork ? profile?.display_name || "" : ""
              }
              className={inputClass}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Town</span>

            <select name="town" required className={inputClass}>
              {TOWNS.map((town) => (
                <option key={town.slug} value={town.slug}>
                  {town.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Work type</span>

            <select
              name="employmentType"
              required
              className={inputClass}
            >
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              {lookingForWork ? "Desired pay" : "Pay or pay range"}{" "}
              <span className="font-normal text-[#7b817c]">
                (optional)
              </span>
            </span>

            <input
              name="pay"
              maxLength={100}
              className={inputClass}
              placeholder="$24–$30/hour"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-semibold">
              {lookingForWork ? "Skills and experience" : "Description"}
            </span>

            <textarea
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className={`${inputClass} py-3`}
              placeholder={
                lookingForWork
                  ? "A short, practical summary of what you do and when you’re available."
                  : "What the work involves, schedule, requirements and anything applicants should know."
              }
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              Contact email{" "}
              <span className="font-normal text-[#7b817c]">
                (optional)
              </span>
            </span>

            <input
              name="email"
              type="email"
              maxLength={160}
              className={inputClass}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              Contact phone{" "}
              <span className="font-normal text-[#7b817c]">
                (optional)
              </span>
            </span>

            <input
              name="phone"
              type="tel"
              maxLength={30}
              className={inputClass}
            />
          </label>

          {!lookingForWork ? (
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold">
                Application link{" "}
                <span className="font-normal text-[#7b817c]">
                  (optional)
                </span>
              </span>

              <input
                name="applyUrl"
                maxLength={500}
                className={inputClass}
                placeholder="yourbusiness.com/jobs"
              />
            </label>
          ) : null}
        </div>

        <p className="text-xs leading-5 text-[#6d746e]">
          Add at least one way for people to respond. Contact information
          entered here will appear on the public listing. Listings expire
          after 45 days.
        </p>

        <div>
          <button className="inline-flex min-h-11 items-center rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white">
            {lookingForWork ? "Post availability" : "Post job"}
          </button>
        </div>
      </form>
    </main>
  );
}
