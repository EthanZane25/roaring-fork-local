import { notFound, redirect } from "next/navigation";
import { getTown, MARKETPLACE_CATEGORIES } from "@/lib/constants";

export default async function TownMarketplaceCategoryPage({ params }: { params: Promise<{ town: string; category: string }> }) {
  const { town: townSlug, category } = await params;
  if (!getTown(townSlug) || !MARKETPLACE_CATEGORIES.includes(category)) notFound();
  redirect(`/marketplace?town=${encodeURIComponent(townSlug)}&category=${encodeURIComponent(category)}`);
}
