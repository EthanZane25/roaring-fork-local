import type { Metadata } from "next";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { getJobs } from "@/lib/data";
import { getTown } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Roaring Fork Valley Jobs",
  description: "Local jobs in Aspen, Basalt, Carbondale, Glenwood Springs, Rifle and the Roaring Fork Valley."
};

export default async function JobsPage() {
  const jobs = await getJobs();
  return (
    <main className="container-site py-12">
      <p className="eyebrow">Work local</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Jobs in the Roaring Fork Valley</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">A focused local job board without unrelated Denver and Front Range listings.</p>
      <div className="mt-10 grid gap-4">
        {jobs.map((job) => (
          <article key={job.id} className="card flex flex-wrap items-center justify-between gap-5 p-6">
            <div>
              <p className="eyebrow">{job.type}</p>
              <h2 className="mt-2 text-xl font-black">{job.title}</h2>
              <p className="mt-1 text-sm font-semibold text-[#5d655d]">{job.company}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-[#687068]"><MapPin size={14} /> {getTown(job.town)?.name}</p>
            </div>
            <div className="rounded-2xl bg-[#eef3ef] px-5 py-3 text-sm font-black text-[#234b36]">{job.pay}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
