import type { Town } from "@/lib/types";

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "Roaring Fork Local";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const TOWNS: Town[] = [
  { slug: "aspen", name: "Aspen", county: "Pitkin", latitude: 39.1911, longitude: -106.8175, tagline: "Dining, events, jobs and local life in Aspen." },
  { slug: "snowmass-village", name: "Snowmass Village", county: "Pitkin", latitude: 39.2130, longitude: -106.9378, tagline: "Snowmass dining, events and community listings." },
  { slug: "basalt", name: "Basalt", county: "Eagle/Pitkin", latitude: 39.3689, longitude: -107.0328, tagline: "Local businesses and community life around Basalt and El Jebel." },
  { slug: "carbondale", name: "Carbondale", county: "Garfield", latitude: 39.4022, longitude: -107.2112, tagline: "Restaurants, classifieds and events in Carbondale." },
  { slug: "glenwood-springs", name: "Glenwood Springs", county: "Garfield", latitude: 39.5505, longitude: -107.3248, tagline: "Discover Glenwood Springs from dinner to deals." },
  { slug: "new-castle", name: "New Castle", county: "Garfield", latitude: 39.5728, longitude: -107.5364, tagline: "New Castle local businesses, listings and events." },
  { slug: "silt", name: "Silt", county: "Garfield", latitude: 39.5486, longitude: -107.6562, tagline: "Silt community listings, businesses and happenings." },
  { slug: "rifle", name: "Rifle", county: "Garfield", latitude: 39.5347, longitude: -107.7831, tagline: "Rifle restaurants, marketplace, jobs and local events." }
];

export const RESTAURANT_CATEGORIES = [
  "breakfast", "brunch", "lunch", "dinner", "open-now", "cheap-eats",
  "burgers", "coffee", "happy-hour", "italian", "mexican", "pizza",
  "sushi", "steak", "outdoor-dining", "family-friendly"
];

export const MARKETPLACE_CATEGORIES = [
  "vehicles", "furniture", "bikes", "ski-snowboard", "outdoor-gear",
  "electronics", "tools", "farm-ranch", "kids-baby", "free"
];

export function getTown(slug: string) {
  return TOWNS.find((town) => town.slug === slug);
}

export function titleize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
