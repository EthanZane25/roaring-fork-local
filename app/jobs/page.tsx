import type { Metadata } from "next";
import { getJobs } from "@/lib/data";
import { getTown } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Jobs",
  description: "Local job listings from Aspen to Rifle."
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const liveInventory = hasSupabaseEnv();

  if (!liveInventory) {
    return (
      <main className="container-site py-14 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Jobs</h1>
          <p className="mt-4 text-[16px] leading-7 text-[#5e665e]">The local jobs inventory is being built now. We’ll publish this directory when the listings are real and current—not fill the page with placeholder jobs.</p>
        </div>
      </main>
    );
  }

  const jobs = await getJobs({ town });
  const townName = town ? getTown(town)?.name : undefined;

  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Jobs</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">
        {townName ? `Current local job listings in ${townName}.` : "Current local job listings from Aspen to Rifle."}
      </p>

      <div className="mt-9 border-y border-[#d9dbd5] bg-white">
        {jobs.map((job, index) => (
          <article key={job.id} className={`grid gap-2 py-4 sm:grid-cols-[160px_1fr_190px] sm:items-center ${index ? "border-t border-[#e4e5df]" : ""}`}>
            <span className="text-[13px] font-semibold text-[#667068]">{getTown(job.town)?.name}</span>
            <div>
              <h2 className="text-[16px] font-semibold">{job.title}</h2>
              <p className="mt-1 text-[13px] text-[#737a74]">{job.company} · {job.type}</p>
            </div>
            <span className="text-[13px] text-[#5f665f] sm:text-right">{job.pay}</span>
          </article>
        ))}
        {!jobs.length ? <p className="py-6 text-sm text-[#606860]">No active jobs match this town right now.</p> : null}
      </div>
    </main>
  );
}
