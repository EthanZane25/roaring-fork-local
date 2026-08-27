import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const { id } = await params;
  const form = await request.formData();
  const status = String(form.get("status") || "");
  if (!["counted", "rejected"].includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const { error } = await context.supabase.from("restaurant_votes").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "held");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(new URL("/admin/votes", request.url), 303);
}
