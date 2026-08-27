import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";

export const metadata = { title: "Vote security", robots: { index: false, follow: false } };

export default async function AdminVotesPage() {
  const context = await getAdminContext();
  if (!context) redirect("/sign-in");
  const [{ data: held }, { data: attempts }] = await Promise.all([
    context.supabase.from("restaurant_votes").select("id,status,risk_score,created_at,user_id,contests(title),restaurants(name),users(email)").eq("status", "held").order("created_at", { ascending: false }).limit(100),
    context.supabase.from("restaurant_vote_attempts").select("id,outcome,risk_score,reason,created_at,contests(title),restaurants(name)").order("created_at", { ascending: false }).limit(100)
  ]);

  return (
    <main className="container-site py-12">
      <Link href="/admin" className="text-sm font-medium text-[#526058] hover:underline">← Admin</Link>
      <h1 className="mt-5 text-3xl font-semibold">Vote security review</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#626862]">Suspicious bursts are quarantined rather than silently added to public totals. Shared IPs are a risk signal, not proof of a duplicate person.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Held votes</h2>
        <div className="mt-3 overflow-x-auto border border-[#d9dbd5] bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-[#f4f3ef] text-xs text-[#666c67]"><tr><th className="px-4 py-3">Contest</th><th className="px-4 py-3">Choice</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Review</th></tr></thead>
            <tbody>
              {(held ?? []).map((vote: any) => {
                const contest = Array.isArray(vote.contests) ? vote.contests[0] : vote.contests;
                const restaurant = Array.isArray(vote.restaurants) ? vote.restaurants[0] : vote.restaurants;
                const appUser = Array.isArray(vote.users) ? vote.users[0] : vote.users;
                return <tr key={vote.id} className="border-t border-[#e5e6e1]"><td className="px-4 py-3">{contest?.title || "Contest"}</td><td className="px-4 py-3 font-medium">{restaurant?.name || "Restaurant"}</td><td className="px-4 py-3 text-xs">{appUser?.email || vote.user_id}</td><td className="px-4 py-3">{vote.risk_score}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2"><form action={`/api/admin/votes/${vote.id}`} method="post" className="flex gap-2"><button name="status" value="counted" className="border border-[#bfc8c1] px-3 py-1.5 text-xs font-semibold">Count</button><button name="status" value="rejected" className="border border-[#d2c4bf] px-3 py-1.5 text-xs font-semibold">Reject</button></form><form action={`/api/admin/users/${vote.user_id}/invalidate`} method="post"><button className="border border-[#c79f93] px-3 py-1.5 text-xs font-semibold text-[#7f3f30]">Invalidate user</button></form></div></td></tr>;
              })}
              {!(held ?? []).length ? <tr><td colSpan={5} className="px-4 py-6 text-sm text-[#707771]">No votes are currently held for review.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent security activity</h2>
        <div className="mt-3 border-y border-[#d9dbd5] bg-white">{(attempts ?? []).map((item: any, index: number) => {
          const contest = Array.isArray(item.contests) ? item.contests[0] : item.contests;
          const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
          return <div key={item.id} className={`grid gap-2 px-2 py-3 text-sm sm:grid-cols-[1.2fr_1fr_100px_60px_2fr] ${index ? "border-t border-[#e5e6e1]" : ""}`}><span>{contest?.title || "Contest"}</span><span>{restaurant?.name || "—"}</span><span className="text-xs">{item.outcome}</span><span className="text-xs">{item.risk_score}</span><span className="text-xs text-[#6e756f]">{item.reason || "—"}</span></div>;
        })}</div>
      </section>
    </main>
  );
}
