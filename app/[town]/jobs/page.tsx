import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getJobs } from "@/lib/data";
import { getTown } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params; const town = getTown(slug);
  return town ? { title: `${town.name} Jobs`, description: `Current local job openings in ${town.name}, Colorado.`, alternates: { canonical: `/${slug}/jobs` } } : { title: "Jobs" };
}
export default async function TownJobs({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params; const town = getTown(slug); if (!town) notFound();
  const jobs = (await getJobs()).filter((job) => job.town === slug);
  return <main className="container-site py-12"><p className="eyebrow">Work local</p><h1 className="mt-3 text-4xl font-black">Jobs in {town.name}</h1><div className="mt-9 grid gap-4">{jobs.map((job)=><article key={job.id} className="card flex flex-wrap items-center justify-between gap-5 p-6"><div><p className="eyebrow">{job.type}</p><h2 className="mt-2 text-xl font-black">{job.title}</h2><p className="mt-1 text-sm font-semibold text-[#5d655d]">{job.company}</p><p className="mt-2 flex items-center gap-1 text-sm text-[#687068]"><MapPin size={14}/>{town.name}</p></div><strong className="rounded-xl bg-[#eef3ef] px-4 py-3 text-sm">{job.pay}</strong></article>)}</div>{!jobs.length?<div className="card mt-6 p-7 text-sm text-[#626a62]">No active job postings yet.</div>:null}</main>;
}
