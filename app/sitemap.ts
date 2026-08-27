import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getListings, getRestaurants } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, listings] = await Promise.all([getRestaurants(), getListings()]);
  const now = new Date();

  const staticUrls = ["", "/restaurants", "/marketplace", "/vote", "/events", "/jobs", "/housing"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8
  }));

  const restaurantUrls = restaurants.map((restaurant) => ({
    url: `${SITE_URL}/restaurants/${restaurant.slug}`,
    lastModified: new Date(restaurant.verifiedAt),
    changeFrequency: "weekly" as const,
    priority: 0.75
  }));

  const listingUrls = listings.map((listing) => ({
    url: `${SITE_URL}/marketplace/${listing.slug}`,
    lastModified: new Date(listing.createdAt),
    changeFrequency: "daily" as const,
    priority: 0.6
  }));

  return [...staticUrls, ...restaurantUrls, ...listingUrls];
}
