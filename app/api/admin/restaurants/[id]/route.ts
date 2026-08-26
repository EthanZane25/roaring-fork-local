import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as any;
  if (!body?.name || !body?.slug || !body?.townSlug || !body?.address) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const { error } = await ctx.supabase.from("restaurants").update({
    name: body.name,
    slug: body.slug,
    town_slug: body.townSlug,
    address: body.address,
    phone: body.phone || null,
    website: body.website || null,
    description: body.description || "",
    cuisines: body.cuisines || [],
    meals: body.meals || [],
    search_tags: body.tags || [],
    price_level: body.priceLevel || 2,
    image_url: body.imageUrl || null,
    is_advertiser: Boolean(body.isAdvertiser),
    published: body.published !== false,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
