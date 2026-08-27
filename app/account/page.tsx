import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
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
        <Link href="/sign-in" className="mt-6 inline-block bg-[#163b2d] px-5 py-3 text-sm font-semibold text-white">View sign-in screen</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

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

  async function signOut() {
    "use server";
    const server = await createClient();
    await server.auth.signOut();
    redirect("/");
  }

  return (
    <main className="container-site max-w-4xl py-12">
      <h1 className="text-4xl font-semibold tracking-[-.03em]">Account</h1>
      <p className="mt-2 text-sm text-[#666d67]">{profile?.display_name || user.email}</p>

      <section className="mt-8 border-y border-[#d9dbd5] bg-white">
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <h2 className="text-sm font-semibold">Email</h2>
            <p className="mt-1 text-sm text-[#666d67]">{user.email}</p>
          </div>
          {emailVerified ? <span className="inline-flex items-center gap-1 text-sm font-medium text-[#315e49]"><BadgeCheck size={15} /> Verified</span> : <span className="text-sm font-medium text-[#8a5a31]">Verify from your email inbox</span>}
        </div>
      </section>

      <div className="mt-6 max-w-xl">
        <PhoneVerification verified={phoneVerified} last4={voterIdentity?.phone_last4} />
      </div>

      <section className="mt-8 border-y border-[#d9dbd5] py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Your vote</h2>
            {contest ? (
              vote ? (
                <p className="mt-2 text-sm text-[#606860]">{contest.title}: <strong className="text-[#202420]">{voteRestaurant?.name || "Restaurant"}</strong>{vote.status === "held" ? " · under review" : ""}</p>
              ) : (
                <p className="mt-2 text-sm text-[#606860]">You have not voted in {contest.title} yet.</p>
              )
            ) : <p className="mt-2 text-sm text-[#606860]">There is no open contest right now.</p>}
          </div>
          {contest ? <Link href="/vote" className="text-sm font-semibold text-[#315e49] hover:underline">Go to vote →</Link> : null}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/marketplace/new" className="border border-[#cfd2cb] bg-white px-4 py-2.5 text-sm font-semibold">Post a classified</Link>
        <Link href="/messages" className="border border-[#cfd2cb] bg-white px-4 py-2.5 text-sm font-semibold">Messages</Link>
      </div>

      {appUser?.banned_at ? <p className="mt-6 text-sm text-[#8a4d3c]">This account is not eligible for community voting.</p> : null}
      <form action={signOut}><button className="mt-8 border border-[#d4d6cf] bg-white px-5 py-3 text-sm font-semibold">Sign out</button></form>
    </main>
  );
}
