import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp, getNetworkPrefix, hashSignal } from "@/lib/vote-security";

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "Suggestion storage is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as {
    name?: string;
    email?: string;
    town?: string;
    subject?: string;
    suggestion?: string;
    company?: string;
    turnstileToken?: string;
  } | null;

  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (body.company) return NextResponse.json({ ok: true });

  const subject = body.subject?.trim() || "";
  const suggestion = body.suggestion?.trim() || "";
  if (subject.length < 4 || subject.length > 160 || suggestion.length < 20 || suggestion.length > 4000) {
    return NextResponse.json({ error: "Please provide a clear subject and suggestion." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const turnstile = await verifyTurnstile(body.turnstileToken, "blog_suggestion", ip);
  if (!turnstile.ok || (process.env.NODE_ENV === "production" && turnstile.skipped)) {
    return NextResponse.json({ error: "Security verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();
  const networkHash = hashSignal("blog-network", getNetworkPrefix(ip));
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  if (networkHash) {
    const { count } = await admin
      .from("blog_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("network_hash", networkHash)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many suggestions were sent recently. Please try again later." }, { status: 429 });
    }
  }

  const { error } = await admin.from("blog_suggestions").insert({
    name: body.name?.trim().slice(0, 100) || null,
    email: body.email?.trim().slice(0, 200) || null,
    town_slug: body.town?.trim() || null,
    subject,
    suggestion,
    network_hash: networkHash,
    status: "new"
  });

  if (error) return NextResponse.json({ error: "Unable to save your suggestion." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
