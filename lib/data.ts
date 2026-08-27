import { demoBlogPosts, demoContest, demoEvents, demoHousing, demoJobs, demoListings, demoRestaurants } from "@/lib/demo-data";
import type { BlogPost, Contest, Cuisine, EventItem, Housing, Job, MarketplaceListing, Restaurant } from "@/lib/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";

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

export async function getRestaurants(input?: { town?: string; category?: string; cuisine?: string; advertiserOnly?: boolean; limit?: number }) {
  if (!hasSupabaseEnv()) {
    return demoRestaurants
      .filter((r) => !input?.town || r.town === input.town)
      .filter((r) => !input?.cuisine || r.cuisine === input.cuisine)
      .filter((r) => !input?.advertiserOnly || r.isAdvertiser)
      .filter((r) => restaurantMatchesCategory(r, input?.category))
      .slice(0, input?.limit ?? 100);
  }

  const supabase = await createClient();
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("published", true)
    .order("name", { ascending: true });

  if (input?.town) query = query.eq("town_slug", input.town);
  if (input?.cuisine) query = query.eq("primary_cuisine", input.cuisine);
  if (input?.advertiserOnly) query = query.eq("is_advertiser", true);
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

async function contestVoteCounts(contestId: string) {
  const counts = new Map<string, number>();
  if (!hasSupabaseServiceRole()) return counts;

  const admin = createAdminClient();
  const { data: votes, error } = await admin
    .from("restaurant_votes")
    .select("restaurant_id,user_id")
    .eq("contest_id", contestId)
    .eq("status", "counted");
  if (error || !votes?.length) return counts;

  const userIds = Array.from(new Set(votes.map((vote: any) => vote.user_id)));
  const { data: users } = await admin
    .from("users")
    .select("id")
    .in("id", userIds)
    .is("banned_at", null)
    .not("email_verified_at", "is", null)
    .not("phone_verified_at", "is", null);
  const validUsers = new Set((users ?? []).map((user: any) => user.id));

  for (const vote of votes) {
    if (!validUsers.has(vote.user_id)) continue;
    counts.set(vote.restaurant_id, (counts.get(vote.restaurant_id) ?? 0) + 1);
  }
  return counts;
}

async function mapContestRow(row: any): Promise<Contest> {
  const supabase = await createClient();
  const { data: eligible, error: eligibleError } = await supabase
    .from("contest_restaurants")
    .select("restaurant_id")
    .eq("contest_id", row.id);
  if (eligibleError) throw eligibleError;

  const restaurantIds = (eligible ?? []).map((item: any) => item.restaurant_id);
  const counts = await contestVoteCounts(row.id);
  if (!restaurantIds.length) {
    return { id: row.id, slug: row.slug, title: row.title, startsAt: row.starts_at, endsAt: row.ends_at, status: row.status, restaurants: [] };
  }

  const { data: restaurants, error: restaurantsError } = await supabase
    .from("restaurants")
    .select("id,slug,name,town_slug,primary_cuisine")
    .in("id", restaurantIds)
    .eq("published", true)
    .order("name");
  if (restaurantsError) throw restaurantsError;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    restaurants: (restaurants ?? []).map((restaurant: any) => ({
      restaurantId: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      town: restaurant.town_slug,
      cuisine: (restaurant.primary_cuisine || "other") as Cuisine,
      votes: counts.get(restaurant.id) ?? 0
    }))
  };
}

export async function getCurrentContest(): Promise<Contest | null> {
  if (!hasSupabaseEnv()) return demoContest;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("contests")
    .select("id,slug,title,starts_at,ends_at,status")
    .eq("status", "open")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapContestRow(data) : null;
}

export async function getContest(slug: string): Promise<Contest | null> {
  if (!hasSupabaseEnv()) return demoContest.slug === slug ? demoContest : null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contests")
    .select("id,slug,title,starts_at,ends_at,status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapContestRow(data) : null;
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

function denverDayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Denver"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export async function getEvents(input?: { town?: string; limit?: number; todayOnly?: boolean }): Promise<EventItem[]> {
  const limit = input?.limit ?? 50;
  const today = denverDayKey(new Date());

  if (!hasSupabaseEnv()) {
    return demoEvents
      .filter((event) => new Date(event.startsAt).getTime() >= Date.now())
      .filter((event) => !input?.town || event.town === input.town)
      .filter((event) => !input?.todayOnly || denverDayKey(event.startsAt) === today)
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase.from("events").select("*").eq("published", true).gte("starts_at", new Date().toISOString()).order("starts_at");
  if (input?.town) query = query.eq("town_slug", input.town);
  query = query.limit(input?.todayOnly ? 100 : limit);
  const { data, error } = await query;
  if (error) throw error;

  const events = (data ?? []).map((e: any) => ({ id: e.id, title: e.title, town: e.town_slug, venue: e.venue, startsAt: e.starts_at, category: e.category_slug }));
  return events
    .filter((event) => !input?.todayOnly || denverDayKey(event.startsAt) === today)
    .slice(0, limit);
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
    cuisine: (row.primary_cuisine || "other") as Cuisine,
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
