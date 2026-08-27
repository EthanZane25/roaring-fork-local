import { notFound, redirect } from "next/navigation";
import { CUISINES, getTown } from "@/lib/constants";

const cuisineValues = new Set<string>(CUISINES.map((item) => item.value).filter(Boolean));

export default async function TownRestaurantCategoryPage({ params }: { params: Promise<{ town: string; category: string }> }) {
  const { town: townSlug, category } = await params;
  if (!getTown(townSlug)) notFound();

  const cuisine = cuisineValues.has(category) ? category : "";
  const query = new URLSearchParams({ town: townSlug });
  if (cuisine) query.set("cuisine", cuisine);
  redirect(`/restaurants?${query.toString()}`);
}
