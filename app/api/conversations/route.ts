import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Messaging requires Supabase." }, { status: 503 });
  const { listingId } = await request.json().catch(() => ({ listingId: null })) as { listingId?: string };
  if (!listingId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to message sellers." }, { status: 401 });

  const { data: listing } = await supabase.from("marketplace_listings").select("id,owner_id").eq("id", listingId).eq("status","active").maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.owner_id === user.id) return NextResponse.json({ error: "This is your listing." }, { status: 400 });

  const { data: existing } = await supabase.from("conversations").select("id").eq("listing_id", listing.id).eq("buyer_id", user.id).eq("seller_id", listing.owner_id).maybeSingle();
  if (existing) return NextResponse.json(existing);

  const { data, error } = await supabase.from("conversations").insert({
    listing_id: listing.id,
    buyer_id: user.id,
    seller_id: listing.owner_id
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Unable to start conversation." }, { status: 500 });
  return NextResponse.json(data);
}
