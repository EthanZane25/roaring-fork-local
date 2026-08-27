import { notFound, redirect } from "next/navigation";
import { getTown } from "@/lib/constants";

export default async function TownPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  if (!getTown(slug)) notFound();
  redirect(`/?town=${encodeURIComponent(slug)}`);
}
