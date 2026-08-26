import type { Metadata } from "next";
import { VotePanel } from "@/components/vote-panel";
import { getPolls } from "@/lib/data";

export const metadata: Metadata = {
  title: "Roaring Fork Local Voting",
  description: "Community voting for restaurants and local favorites across the Roaring Fork Valley."
};

export default async function VotePage() {
  const polls = await getPolls();
  return (
    <main className="container-site py-12">
      <p className="eyebrow">Community rankings</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Vote once. Make it count.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[#5e665e]">
        Production voting is tied to an authenticated account and protected by a database uniqueness constraint so one account cannot cast two votes in the same poll.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {polls.map((poll) => <VotePanel key={poll.id} poll={poll} />)}
      </div>
    </main>
  );
}
