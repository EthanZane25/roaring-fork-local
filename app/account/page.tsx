import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="container-site max-w-3xl py-14">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 text-4xl font-black">Demo mode</h1>
        <div className="card mt-8 p-7">
          <p className="leading-7 text-[#596159]">Connect Supabase using the variables in <code>.env.example</code> to enable real accounts, persistent classifieds, messaging and database-enforced voting.</p>
          <Link href="/sign-in" className="mt-5 inline-block rounded-xl bg-[#163b2d] px-5 py-3 text-sm font-black text-white">View sign-in screen</Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  async function signOut() {
    "use server";
    const server = await createClient();
    await server.auth.signOut();
    redirect("/");
  }

  return (
    <main className="container-site max-w-4xl py-14">
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 text-4xl font-black">{profile?.display_name || user.email}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/marketplace/new" className="card p-6"><strong>Post a classified</strong><p className="mt-2 text-sm text-[#646c64]">Create a new local listing.</p></Link>
        <Link href="/vote" className="card p-6"><strong>Community voting</strong><p className="mt-2 text-sm text-[#646c64]">See active verified polls.</p></Link>
        <Link href="/messages" className="card p-6"><strong>Messages</strong><p className="mt-2 text-sm text-[#646c64]">Your marketplace conversations.</p></Link>
      </div>
      <form action={signOut}><button className="mt-8 rounded-xl border border-[#d4d6cf] bg-white px-5 py-3 text-sm font-black">Sign out</button></form>
    </main>
  );
}
