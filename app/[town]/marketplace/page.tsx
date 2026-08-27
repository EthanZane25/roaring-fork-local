import { notFound, redirect } from "next/navigation";
import { getTown } from "@/lib/constants";

export default async function TownMarketplacePage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  if (!getTown(slug)) notFound();
  redirect(`/marketplace?town=${encodeURIComponent(slug)}`);
}
