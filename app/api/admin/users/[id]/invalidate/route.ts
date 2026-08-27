import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const { id } = await params;
  const now = new Date().toISOString();
  const [{ error: userError }, { error: voteError }] = await Promise.all([
    context.supabase.from("users").update({ banned_at: now, updated_at: now }).eq("id", id),
    context.supabase.from("restaurant_votes").update({ status: "rejected", updated_at: now }).eq("user_id", id)
  ]);
  if (userError || voteError) return NextResponse.json({ error: userError?.message || voteError?.message || "Unable to invalidate user." }, { status: 500 });
  return NextResponse.redirect(new URL("/admin/votes", request.url), 303);
}
