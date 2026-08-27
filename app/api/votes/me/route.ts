import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ state: "logged_out", productionVoting: false });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ state: "logged_out", productionVoting: true });

  const admin = createAdminClient();
  const slug = request.nextUrl.searchParams.get("contest");
  let contestQuery = admin.from("contests").select("id,slug,title,ends_at,status");
  if (slug) contestQuery = contestQuery.eq("slug", slug);
  else contestQuery = contestQuery.eq("status", "open").lte("starts_at", new Date().toISOString()).gt("ends_at", new Date().toISOString()).order("starts_at", { ascending: false }).limit(1);
  const { data: contest } = await contestQuery.maybeSingle();
  if (!contest) return NextResponse.json({ state: "closed", productionVoting: true });

  if (!user.email_confirmed_at) {
    return NextResponse.json({ state: "unverified", needs: ["email"], contestId: contest.id, endsAt: contest.ends_at, productionVoting: true });
  }

  const { data: appUser } = await admin.from("users").select("email_verified_at,phone_verified_at,banned_at").eq("id", user.id).maybeSingle();
  if (appUser?.banned_at) return NextResponse.json({ state: "ineligible", contestId: contest.id, endsAt: contest.ends_at, productionVoting: true });
  const needs: string[] = [];
  if (!appUser?.email_verified_at) needs.push("email");
  if (!appUser?.phone_verified_at) needs.push("phone");
  if (needs.length) return NextResponse.json({ state: "unverified", needs, contestId: contest.id, endsAt: contest.ends_at, productionVoting: true });

  const { data: vote } = await admin
    .from("restaurant_votes")
    .select("restaurant_id,status,restaurants(name)")
    .eq("contest_id", contest.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (vote) {
    const restaurant = Array.isArray((vote as any).restaurants) ? (vote as any).restaurants[0] : (vote as any).restaurants;
    return NextResponse.json({
      state: "already_voted",
      contestId: contest.id,
      endsAt: contest.ends_at,
      restaurantId: vote.restaurant_id,
      restaurantName: restaurant?.name || "Restaurant",
      voteStatus: vote.status,
      productionVoting: true
    });
  }

  return NextResponse.json({ state: "can_vote", contestId: contest.id, endsAt: contest.ends_at, productionVoting: true });
}
