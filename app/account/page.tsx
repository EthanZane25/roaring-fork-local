import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Circle } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { PhoneVerification } from "@/components/phone-verification";
import { getCurrentContest } from "@/lib/data";

export default async function AccountPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="container-site max-w-3xl py-14">
        <h1 className="text-4xl font-semibold tracking-[-.03em]">Account</h1>
        <p className="mt-4 leading-7 text-[#596159]">Connect Supabase using the variables in <code>.env.example</code> to enable sign-in, email/phone verification, messaging, and production voting.</p>
        <Link href="/sign-in" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#163b2d] px-5 text-sm font-semibold text-white">View sign-in screen</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");

  const contest = await getCurrentContest();
  const [{ data: profile }, { data: voterIdentity }, { data: appUser }, voteResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("voter_identities").select("phone_last4").eq("user_id", user.id).maybeSingle(),
    supabase.from("users").select("email_verified_at,phone_verified_at,banned_at").eq("id", user.id).maybeSingle(),
    contest
      ? supabase.from("restaurant_votes").select("restaurant_id,status,restaurants(name)").eq("contest_id", contest.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  const vote = voteResult.data as any;
  const voteRestaurant = vote ? (Array.isArray(vote.restaurants) ? vote.restaurants[0] : vote.restaurants) : null;
  const emailVerified = Boolean(user.email_confirmed_at && appUser?.email_verified_at);
  const phoneVerified = Boolean(profile?.phone_verified && voterIdentity && appUser?.phone_verified_at);
  const voted = Boolean(vote);

  async function signOut() {
    "use server";
    const server = await createClient();
    await server.auth.signOut();
    redirect("/");
  }

  const progress = [
    ["Email", emailVerified, emailVerified ? "Verified" : "Confirm the email we sent you"],
    ["Phone", phoneVerified, phoneVerified ? `Verified${voterIdentity?.phone_last4 ? ` · •••• ${voterIdentity.phone_last4}` : ""}` : "Verify once so one person gets one vote"],
    ["Vote", voted, contest ? (voted ? `Recorded for ${voteRestaurant?.name || "your choice"}` : "Ready when email and phone are verified") : "No open contest"]
  ] as const;

  return (
    <main className="container-site max-w-4xl py-12">
      <p className="eyebrow">Your local account</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.03em]">Account</h1>
      <p className="mt-2 text-sm text-[#666d67]">{profile?.display_name || user.email}</p>

      {contest ? (
        <section className="mt-8 rounded-2xl border border-[#d9ddd7] bg-[#f7f5ee] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.1em] text-[#806927]">Voting progress</p>
              <h2 className="mt-2 text-xl font-semibold">{contest.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#667069]">One vote per verified phone, so locals decide, not bots.</p>
            </div>
            <Link href={`/vote#${contest.slug}`} className="text-sm font-semibold text-[#173f30] hover:underline">Go to vote →</Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {progress.map(([label, done, detail], index) => (
              <div key={label} className="rounded-xl border border-[#dfe2dc] bg-white p-4">
                <div className="flex items-center gap-2">
                  {done ? <BadgeCheck size={17} className="text-[#2d6546]" /> : <Circle size={17} className="text-[#9aa29c]" />}
                  <span className="text-sm font-semibold">{index + 1}. {label}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#69716b]">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 border-y border-[#d9dbd5] bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 py-4">
          <div>
            <h2 className="text-sm font-semibold">Email</h2>
            <p className="mt-1 text-sm text-[#666d67]">{user.email}</p>
          </div>
          {emailVerified ? <span className="inline-flex items-center gap-1 text-sm font-medium text-[#315e49]"><BadgeCheck size={15} /> Verified</span> : <span className="text-sm font-medium text-[#8a5a31]">Check your inbox</span>}
        </div>
      </section>

      <div className="mt-6 max-w-xl">
        <PhoneVerification verified={phoneVerified} last4={voterIdentity?.phone_last4} />
        {!phoneVerified ? <p className="mt-3 text-xs leading-5 text-[#6e766f]">Why phone verification? One verified phone gets one vote. It reduces duplicate and automated voting without changing the public results you can browse.</p> : null}
      </div>

      <section className="mt-8 border-y border-[#d9dbd5] py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Your vote</h2>
            {contest ? (
              vote ? (
                <>
                  <p className="mt-2 text-sm text-[#606860]">{contest.title}: <strong className="text-[#202420]">{voteRestaurant?.name || "Restaurant"}</strong></p>
                  {vote.status === "held" ? <p className="mt-2 max-w-xl text-xs leading-5 text-[#7a6652]">Your vote is being checked and is not in the public total yet. Check the vote page later; if it clears verification it will be counted automatically.</p> : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-[#606860]">You have not voted in {contest.title} yet.</p>
              )
            ) : <p className="mt-2 text-sm text-[#606860]">There is no open contest right now.</p>}
          </div>
          {contest ? <Link href={`/vote#${contest.slug}`} className="text-sm font-semibold text-[#315e49] hover:underline">Go to vote →</Link> : null}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/marketplace/new" className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd2cb] bg-white px-4 text-sm font-semibold">Post a classified</Link>
        <Link href="/messages" className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd2cb] bg-white px-4 text-sm font-semibold">Messages</Link>
      </div>

      {appUser?.banned_at ? <p className="mt-6 text-sm text-[#8a4d3c]">This account is not eligible for community voting.</p> : null}
      <form action={signOut}><button className="mt-8 min-h-11 rounded-lg border border-[#d4d6cf] bg-white px-5 text-sm font-semibold">Sign out</button></form>
    </main>
  );
}
