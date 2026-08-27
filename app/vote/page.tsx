import type { Metadata } from "next";
import { VotePanel } from "@/components/vote-panel";
import { getCurrentContest } from "@/lib/data";

export const metadata: Metadata = {
  title: "Roaring Fork Local Voting",
  description: "One verified local restaurant contest at a time across the Roaring Fork corridor."
};

export default async function VotePage() {
  const contest = await getCurrentContest();
  return (
    <main className="container-site py-10 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Local vote</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e665e]">One current contest, one verified person, one vote row. You can change your choice until the contest closes.</p>
      <div className="mt-8 max-w-3xl">
        {contest ? <VotePanel contest={contest} /> : <p className="border-y border-[#d9dbd5] py-7 text-sm text-[#606760]">There is no open contest right now.</p>}
      </div>
    </main>
  );
}
