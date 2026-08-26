import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Messaging requires Supabase." }, { status: 503 });
  const payload = await request.json().catch(() => null) as { conversationId?: string; body?: string } | null;
  const body = payload?.body?.trim();
  if (!payload?.conversationId || !body || body.length > 2000) return NextResponse.json({ error: "Invalid message." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: conversation } = await supabase.from("conversations").select("id,buyer_id,seller_id").eq("id", payload.conversationId).maybeSingle();
  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body
  });
  if (error) return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
