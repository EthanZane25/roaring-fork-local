import { notFound, redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { MessageComposer } from "@/components/message-composer";

export const metadata = { title: "Conversation", robots: { index: false, follow: false } };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseEnv()) redirect("/sign-in");
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,marketplace_listings(title)")
    .eq("id", id)
    .maybeSingle();

  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) notFound();

  const { data: messages } = await supabase.from("messages").select("id,sender_id,body,created_at").eq("conversation_id", id).order("created_at");

  return (
    <main className="container-site max-w-3xl py-12">
      <p className="eyebrow">Conversation</p>
      <h1 className="mt-3 text-3xl font-semibold">{(conversation as any).marketplace_listings?.title || "Marketplace message"}</h1>
      <div className="card mt-8 p-5">
        <div className="grid gap-3">
          {(messages ?? []).map((message) => {
            const mine = message.sender_id === user.id;
            return <div key={message.id} className={`max-w-[82%] rounded-md px-4 py-3 text-sm leading-6 ${mine ? "ml-auto bg-[#163b2d] text-white" : "bg-[#efeee8]"}`}>{message.body}</div>;
          })}
          {!messages?.length ? <p className="text-sm text-[#626a62]">Start the conversation below.</p> : null}
        </div>
        <MessageComposer conversationId={id} />
      </div>
    </main>
  );
}
