import type { BlogPost, Contest, EventItem, Housing, Job, MarketplaceListing, Restaurant } from "@/lib/types";

export const demoRestaurants: Restaurant[] = [
  {
    id: "r1", slug: "white-house-tavern", name: "White House Tavern", town: "aspen",
    address: "302 E Hopkins Ave, Aspen, CO", description: "A compact Aspen favorite known for sandwiches, salads and a lively bar in a historic miner's cottage.",
    cuisine: "american", cuisines: ["american"], meals: ["lunch", "dinner"], priceLevel: 2,
    latitude: 39.1908, longitude: -106.8179, imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-20", localVotes: 932, tags: ["burgers", "family-friendly"]
  },
  {
    id: "r2", slug: "paradise-bakery", name: "Paradise Bakery", town: "aspen",
    address: "320 S Galena St, Aspen, CO", description: "Central Aspen bakery serving coffee, breakfast pastries, cookies and ice cream.",
    cuisine: "cafe-bakery", cuisines: ["bakery", "coffee"], meals: ["breakfast", "lunch"], priceLevel: 1,
    latitude: 39.1897, longitude: -106.8172, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-18", localVotes: 771, tags: ["breakfast", "coffee", "family-friendly"]
  },
  {
    id: "r3", slug: "mezzaluna-aspen", name: "Mezzaluna", town: "aspen",
    address: "624 E Cooper Ave, Aspen, CO", description: "Relaxed Italian dining with wood-fired dishes, pizza and a central Aspen patio.",
    cuisine: "italian", cuisines: ["italian", "pizza"], meals: ["lunch", "dinner"], priceLevel: 3,
    latitude: 39.1885, longitude: -106.8140, imageUrl: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-22", localVotes: 640, tags: ["pizza", "outdoor-dining"]
  },
  {
    id: "r4", slug: "sake-aspen", name: "Sake", town: "aspen",
    address: "110 Carriage Way, Snowmass Village, CO", description: "Contemporary Japanese and sushi selections with mountain-resort energy.",
    cuisine: "japanese", cuisines: ["japanese", "sushi"], meals: ["dinner"], priceLevel: 4,
    latitude: 39.2088, longitude: -106.9494, imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: false, verifiedAt: "2026-08-17", localVotes: 488, tags: ["sushi"]
  },
  {
    id: "r5", slug: "the-pullman", name: "The Pullman", town: "glenwood-springs",
    address: "330 7th St, Glenwood Springs, CO", description: "Downtown Glenwood Springs restaurant with creative American plates and cocktails.",
    cuisine: "american", cuisines: ["american"], meals: ["lunch", "dinner"], priceLevel: 3,
    latitude: 39.5471, longitude: -107.3248, imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-21", localVotes: 584, tags: ["happy-hour"]
  },
  {
    id: "r6", slug: "silo", name: "Silo", town: "carbondale",
    address: "1909 Dolores Way, Carbondale, CO", description: "Neighborhood breakfast and lunch spot with coffee, bowls and locally minded ingredients.",
    cuisine: "american", cuisines: ["american", "coffee"], meals: ["breakfast", "lunch"], priceLevel: 2,
    latitude: 39.3998, longitude: -107.2103, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-19", localVotes: 415, tags: ["breakfast", "coffee"]
  },
  {
    id: "r7", slug: "brick-pony", name: "Brick Pony Pub", town: "basalt",
    address: "202 Midland Ave, Basalt, CO", description: "Casual Basalt pub with burgers, comfort food and local beer.",
    cuisine: "american", cuisines: ["american", "pub"], meals: ["lunch", "dinner"], priceLevel: 2,
    latitude: 39.3686, longitude: -107.0322, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-16", localVotes: 363, tags: ["burgers", "happy-hour", "family-friendly"]
  },
  {
    id: "r8", slug: "sammy-pizza", name: "Sammy's Rocky Mountain Pizza", town: "rifle",
    address: "412 Park Ave, Rifle, CO", description: "Rifle pizza shop serving pies, wings and casual family meals.",
    cuisine: "italian", cuisines: ["pizza", "italian"], meals: ["lunch", "dinner"], priceLevel: 1,
    latitude: 39.5340, longitude: -107.7834, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=80",
    isAdvertiser: false, openNow: true, verifiedAt: "2026-08-15", localVotes: 284, tags: ["pizza", "family-friendly"]
  }
];

export const demoListings: MarketplaceListing[] = [
  { id: "m1", slug: "2022-specialized-stumpjumper", title: "2022 Specialized Stumpjumper", town: "carbondale", price: 1850, category: "bikes", description: "Well-maintained trail bike, recent service, ready to ride.", imageUrl: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1400&q=80", createdAt: "2026-08-26T08:30:00-06:00", sellerName: "Mike R.", sellerVerified: true },
  { id: "m2", slug: "solid-oak-dining-table", title: "Solid oak dining table", town: "glenwood-springs", price: 275, category: "furniture", description: "Six-seat table in good condition. Pickup near downtown Glenwood.", imageUrl: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1400&q=80", createdAt: "2026-08-26T07:10:00-06:00", sellerName: "Sarah K.", sellerVerified: true },
  { id: "m3", slug: "free-moving-boxes", title: "Free moving boxes", town: "aspen", price: 0, category: "free", description: "About 30 flattened moving boxes. Free pickup today.", imageUrl: "https://images.unsplash.com/photo-1607166452427-7e4477079cb9?auto=format&fit=crop&w=1400&q=80", createdAt: "2026-08-25T18:00:00-06:00", sellerName: "J. Lewis", sellerVerified: false },
  { id: "m4", slug: "all-mountain-skis-bindings", title: "All-mountain skis + bindings", town: "basalt", price: 390, category: "ski-snowboard", description: "178 cm all-mountain setup, drilled once, normal cosmetic wear.", imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1400&q=80", createdAt: "2026-08-25T12:30:00-06:00", sellerName: "Taylor M.", sellerVerified: true }
];

export const demoContest: Contest = {
  id: "contest-best-burger-2026",
  slug: "best-burger-valley-2026",
  title: "Best Burger in the Valley",
  startsAt: "2026-08-26T00:00:00-06:00",
  endsAt: "2026-09-15T23:59:59-06:00",
  status: "open",
  restaurants: [
    { restaurantId: "r1", slug: "white-house-tavern", name: "White House Tavern", town: "aspen", cuisine: "american", votes: 1842 },
    { restaurantId: "r7", slug: "brick-pony", name: "Brick Pony Pub", town: "basalt", cuisine: "american", votes: 1366 },
    { restaurantId: "r5", slug: "the-pullman", name: "The Pullman", town: "glenwood-springs", cuisine: "american", votes: 921 }
  ]
};

export const demoEvents: EventItem[] = [
  { id: "e1", title: "Live music on the mall", town: "aspen", venue: "Downtown Aspen", startsAt: "2026-08-26T18:00:00-06:00", category: "music" },
  { id: "e2", title: "Trivia night", town: "glenwood-springs", venue: "Downtown", startsAt: "2026-08-26T19:00:00-06:00", category: "nightlife" },
  { id: "e3", title: "Community concert", town: "rifle", venue: "Centennial Park", startsAt: "2026-08-26T19:30:00-06:00", category: "music" },
  { id: "e4", title: "Community market", town: "carbondale", venue: "4th Street Plaza", startsAt: "2026-08-27T16:00:00-06:00", category: "community" }
];

export const demoJobs: Job[] = [
  { id: "j1", title: "Server", company: "Mountain Dining Group", town: "aspen", pay: "$35–$50/hr incl. tips", type: "Full time" },
  { id: "j2", title: "Office Manager", company: "Valley Services", town: "basalt", pay: "$62,000/year", type: "Full time" },
  { id: "j3", title: "Carpenter", company: "Roaring Fork Builders", town: "carbondale", pay: "$30–$38/hr", type: "Full time" }
];

export const demoHousing: Housing[] = [
  { id: "h1", title: "Room in shared house", town: "carbondale", price: 1250, bedrooms: 1, type: "Room" },
  { id: "h2", title: "One-bedroom apartment", town: "glenwood-springs", price: 1850, bedrooms: 1, type: "Apartment" },
  { id: "h3", title: "Studio near downtown", town: "rifle", price: 1150, bedrooms: 0, type: "Studio" }
];

export const demoBlogPosts: BlogPost[] = [
  {
    id: "b1", slug: "how-roaring-fork-local-will-cover-the-valley", title: "How Roaring Fork Local will cover the valley",
    excerpt: "A practical local guide should make it easier to find what is open, what is for sale and what is happening without digging through several different sites.",
    body: "Roaring Fork Local is being built around everyday local information. The goal is simple: make restaurants, classifieds, jobs, housing, events and community recommendations easier to find from Aspen through Rifle.\n\nThe site will continue to improve as local businesses claim their pages and residents submit corrections, tips and story suggestions. We want useful information to stay current instead of becoming another directory that slowly goes stale.",
    authorName: "Roaring Fork Local", town: "aspen", publishedAt: "2026-08-26T09:00:00-06:00"
  },
  {
    id: "b2", slug: "send-us-your-local-suggestions", title: "What should we cover next?",
    excerpt: "Tell us about a new restaurant, a useful local resource, a community issue or something people in the valley should know about.",
    body: "Some of the best local information starts with a neighbor sending a tip. If there is a restaurant we missed, an event that deserves attention, a useful service, a recurring local problem or a story you think we should look into, send it to us.\n\nSuggestions are reviewed before anything is published. Sending a suggestion does not automatically create a public post.",
    authorName: "Roaring Fork Local", publishedAt: "2026-08-26T08:00:00-06:00"
  }
];
