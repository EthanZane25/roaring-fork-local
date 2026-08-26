import type { MetadataRoute } from "next";
import { MARKETPLACE_CATEGORIES, RESTAURANT_CATEGORIES, SITE_URL, TOWNS } from "@/lib/constants";
import { getListings, getRestaurants } from "@/lib/data";
import type { Restaurant } from "@/lib/types";

function restaurantMatches(restaurant: Restaurant, category: string) {
  if (category === "open-now") return restaurant.openNow === true;
  if (category === "cheap-eats") return restaurant.priceLevel <= 2;
  return restaurant.tags.includes(category) || restaurant.cuisines.includes(category) || restaurant.meals.includes(category);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, listings] = await Promise.all([getRestaurants(), getListings()]);
  const now = new Date();

  const staticUrls = [
    "", "/restaurants", "/marketplace", "/vote", "/events", "/jobs", "/housing"
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : .8
  }));

  const townUrls = TOWNS.flatMap((town) => [
    { url: `${SITE_URL}/${town.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: .85 },
    { url: `${SITE_URL}/${town.slug}/restaurants`, lastModified: now, changeFrequency: "daily" as const, priority: .8 },
    { url: `${SITE_URL}/${town.slug}/marketplace`, lastModified: now, changeFrequency: "daily" as const, priority: .75 },
    { url: `${SITE_URL}/${town.slug}/events`, lastModified: now, changeFrequency: "daily" as const, priority: .7 },
    { url: `${SITE_URL}/${town.slug}/jobs`, lastModified: now, changeFrequency: "daily" as const, priority: .7 },
    { url: `${SITE_URL}/${town.slug}/housing`, lastModified: now, changeFrequency: "daily" as const, priority: .7 }
  ]);

  const restaurantCategoryUrls = TOWNS.flatMap((town) =>
    RESTAURANT_CATEGORIES
      .filter((category) => restaurants.filter((restaurant) => restaurant.town === town.slug && restaurantMatches(restaurant, category)).length >= 3)
      .map((category) => ({
        url: `${SITE_URL}/${town.slug}/restaurants/${category}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: .7
      }))
  );

  const marketplaceCategoryUrls = TOWNS.flatMap((town) =>
    MARKETPLACE_CATEGORIES
      .filter((category) => listings.filter((listing) => listing.town === town.slug && listing.category === category).length >= 3)
      .map((category) => ({
        url: `${SITE_URL}/${town.slug}/marketplace/${category}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: .65
      }))
  );

  const restaurantUrls = restaurants.map((restaurant) => ({
    url: `${SITE_URL}/restaurants/${restaurant.slug}`,
    lastModified: new Date(restaurant.verifiedAt),
    changeFrequency: "weekly" as const,
    priority: .75
  }));

  const listingUrls = listings.map((listing) => ({
    url: `${SITE_URL}/marketplace/${listing.slug}`,
    lastModified: new Date(listing.createdAt),
    changeFrequency: "daily" as const,
    priority: .6
  }));

  return [
    ...staticUrls,
    ...townUrls,
    ...restaurantCategoryUrls,
    ...marketplaceCategoryUrls,
    ...restaurantUrls,
    ...listingUrls
  ];
}
