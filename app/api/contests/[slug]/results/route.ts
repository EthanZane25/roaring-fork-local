import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoContest } from "@/lib/demo-data";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabaseEnv() || !hasSupabaseServiceRole()) {
    if (slug !== demoContest.slug) return NextResponse.json({ error: "Contest not found." }, { status: 404 });
    return NextResponse.json({ contest: { slug, title: demoContest.title, endsAt: demoContest.endsAt }, results: demoContest.restaurants.map((restaurant) => ({ restaurantId: restaurant.restaurantId, name: restaurant.name, votes: restaurant.votes })) });
  }

  const admin = createAdminClient();
  const { data: contest } = await admin.from("contests").select("id,slug,title,ends_at").eq("slug", slug).maybeSingle();
  if (!contest) return NextResponse.json({ error: "Contest not found." }, { status: 404 });

  const [{ data: eligible }, { data: votes }] = await Promise.all([
    admin.from("contest_restaurants").select("restaurant_id,restaurants(name)").eq("contest_id", contest.id),
    admin.from("restaurant_votes").select("restaurant_id,user_id").eq("contest_id", contest.id).eq("status", "counted")
  ]);
  const userIds = Array.from(new Set((votes ?? []).map((vote: any) => vote.user_id)));
  const validUsers = new Set<string>();
  if (userIds.length) {
    const { data: users } = await admin.from("users").select("id").in("id", userIds).is("banned_at", null).not("email_verified_at", "is", null).not("phone_verified_at", "is", null);
    for (const user of users ?? []) validUsers.add(user.id);
  }

  const counts = new Map<string, number>();
  for (const vote of votes ?? []) {
    if (!validUsers.has(vote.user_id)) continue;
    counts.set(vote.restaurant_id, (counts.get(vote.restaurant_id) ?? 0) + 1);
  }

  const results = (eligible ?? []).map((item: any) => {
    const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
    return { restaurantId: item.restaurant_id, name: restaurant?.name || "Restaurant", votes: counts.get(item.restaurant_id) ?? 0 };
  }).sort((a: any, b: any) => b.votes - a.votes || a.name.localeCompare(b.name));

  return NextResponse.json({ contest: { slug: contest.slug, title: contest.title, endsAt: contest.ends_at }, results });
}
