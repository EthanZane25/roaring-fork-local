import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages", robots: { index: false, follow: false } };

export default async function MessagesPage() {
  if (!hasSupabaseEnv()) redirect("/sign-in");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id,created_at,listing_id,marketplace_listings(title,slug)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <main className="container-site max-w-3xl py-12">
      <p className="eyebrow">Marketplace</p>
      <h1 className="mt-3 text-4xl font-black">Messages</h1>
      <div className="card mt-8 divide-y divide-[#e1e2dc]">
        {(conversations ?? []).map((conversation: any) => (
          <Link key={conversation.id} href={`/messages/${conversation.id}`} className="block p-5 hover:bg-[#f7f7f2]">
            <strong>{conversation.marketplace_listings?.title || "Marketplace conversation"}</strong>
            <p className="mt-1 text-xs text-[#6b736b]">Open conversation</p>
          </Link>
        ))}
        {!conversations?.length ? <p className="p-6 text-sm text-[#626a62]">No messages yet.</p> : null}
      </div>
    </main>
  );
}
