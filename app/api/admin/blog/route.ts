import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

export async function POST(request: Request) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await request.json().catch(() => null) as { title?: string; excerpt?: string; body?: string; town?: string; authorName?: string; status?: string } | null;
  if (!body?.title?.trim() || !body.excerpt?.trim() || !body.body?.trim()) return NextResponse.json({ error: "Title, excerpt and body are required." }, { status: 400 });
  const baseSlug = slugify(body.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const status = body.status === "published" ? "published" : "draft";
  const { error } = await context.supabase.from("blog_posts").insert({
    slug,
    title: body.title.trim().slice(0, 180),
    excerpt: body.excerpt.trim().slice(0, 500),
    body: body.body.trim(),
    author_id: context.user.id,
    author_name: body.authorName?.trim().slice(0, 120) || context.profile.display_name || "Roaring Fork Local",
    town_slug: body.town?.trim() || null,
    status,
    published_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, slug });
}
