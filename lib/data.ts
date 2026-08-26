import { demoBlogPosts, demoEvents, demoHousing, demoJobs, demoListings, demoPolls, demoRestaurants } from "@/lib/demo-data";
import type { BlogPost, EventItem, Housing, Job, MarketplaceListing, Poll, Restaurant } from "@/lib/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function restaurantMatchesCategory(restaurant: Restaurant, category?: string) {
  if (!category) return true;
  if (category === "open-now") return restaurant.openNow === true;
  if (category === "cheap-eats") return restaurant.priceLevel <= 2;
  return (
    restaurant.tags.includes(category) ||
    restaurant.cuisines.includes(category) ||
    restaurant.meals.includes(category)
  );
}

export async function getRestaurants(input?: { town?: string; category?: string; limit?: number }) {
  if (!hasSupabaseEnv()) {
    return demoRestaurants
      .filter((r) => !input?.town || r.town === input.town)
      .filter((r) => restaurantMatchesCategory(r, input?.category))
      .slice(0, input?.limit ?? 100);
  }

  const supabase = await createClient();
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("published", true)
    .order("local_votes", { ascending: false });

  if (input?.town) query = query.eq("town_slug", input.town);
  if (input?.category === "open-now") query = query.eq("open_now", true);
  else if (input?.category === "cheap-eats") query = query.lte("price_level", 2);
  else if (input?.category) {
    query = query.or(`search_tags.cs.{${input.category}},cuisines.cs.{${input.category}},meals.cs.{${input.category}}`);
  }
  if (input?.limit) query = query.limit(input.limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapRestaurant);
}

export async function getRestaurant(slug: string) {
  if (!hasSupabaseEnv()) return demoRestaurants.find((r) => r.slug === slug) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRestaurant(data) : null;
}

export async function getListings(input?: { town?: string; category?: string; limit?: number }) {
  if (!hasSupabaseEnv()) {
    return demoListings
      .filter((x) => !input?.town || x.town === input.town)
      .filter((x) => !input?.category || x.category === input.category)
      .slice(0, input?.limit ?? 100);
  }
  const supabase = await createClient();
  let query = supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (input?.town) query = query.eq("town_slug", input.town);
  if (input?.category) query = query.eq("category_slug", input.category);
  if (input?.limit) query = query.limit(input.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapListing);
}

export async function getListing(slug: string) {
  if (!hasSupabaseEnv()) return demoListings.find((x) => x.slug === slug) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("marketplace_listings").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (error) throw error;
  return data ? mapListing(data) : null;
}

export async function getPolls(): Promise<Poll[]> {
  if (!hasSupabaseEnv()) return demoPolls;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("id, slug, title, description, closes_at, poll_options(id,label,town_slug,restaurant_id,vote_count)")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id, slug: p.slug, title: p.title, description: p.description,
    closesAt: p.closes_at ?? undefined,
    options: (p.poll_options ?? []).map((o: any) => ({
      id: o.id, label: o.label, town: o.town_slug ?? undefined, votes: o.vote_count ?? 0, restaurantId: o.restaurant_id ?? undefined
    }))
  }));
}


export async function getBlogPosts(input?: { limit?: number; town?: string }): Promise<BlogPost[]> {
  if (!hasSupabaseEnv()) {
    return demoBlogPosts
      .filter((post) => !input?.town || post.town === input.town)
      .slice(0, input?.limit ?? 100);
  }
  const supabase = await createClient();
  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (input?.town) query = query.eq("town_slug", input.town);
  if (input?.limit) query = query.limit(input.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapBlogPost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (!hasSupabaseEnv()) return demoBlogPosts.find((post) => post.slug === slug) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data ? mapBlogPost(data) : null;
}

export async function getEvents(): Promise<EventItem[]> {
  if (!hasSupabaseEnv()) return demoEvents;
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("published", true).gte("starts_at", new Date().toISOString()).order("starts_at").limit(50);
  if (error) throw error;
  return (data ?? []).map((e: any) => ({ id: e.id, title: e.title, town: e.town_slug, venue: e.venue, startsAt: e.starts_at, category: e.category_slug }));
}

export async function getJobs(): Promise<Job[]> {
  if (!hasSupabaseEnv()) return demoJobs;
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((j: any) => ({ id: j.id, title: j.title, company: j.company, town: j.town_slug, pay: j.pay_text, type: j.employment_type }));
}

export async function getHousing(): Promise<Housing[]> {
  if (!hasSupabaseEnv()) return demoHousing;
  const supabase = await createClient();
  const { data, error } = await supabase.from("housing_listings").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((h: any) => ({ id: h.id, title: h.title, town: h.town_slug, price: Number(h.price), bedrooms: h.bedrooms, type: h.listing_type }));
}

function mapRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    town: row.town_slug,
    address: row.address,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? "",
    cuisines: row.cuisines ?? [],
    meals: row.meals ?? [],
    priceLevel: row.price_level ?? 2,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    imageUrl: row.image_url ?? "",
    isAdvertiser: Boolean(row.is_advertiser),
    openNow: row.open_now ?? undefined,
    verifiedAt: row.verified_at ?? row.updated_at,
    localVotes: row.local_votes ?? 0,
    tags: row.search_tags ?? []
  };
}

function mapListing(row: any): MarketplaceListing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    town: row.town_slug,
    price: Number(row.price),
    category: row.category_slug,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    createdAt: row.created_at,
    sellerName: row.seller_name ?? "Local seller",
    sellerVerified: Boolean(row.seller_verified)
  };
}

function mapBlogPost(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    authorName: row.author_name ?? "Roaring Fork Local",
    town: row.town_slug ?? undefined,
    publishedAt: row.published_at ?? row.created_at,
    imageUrl: row.image_url ?? undefined
  };
}
