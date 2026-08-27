import { notFound, redirect } from "next/navigation";
import { AdminRestaurantForm } from "@/components/admin-restaurant-form";
import { getAdminContext } from "@/lib/admin";

export default async function EditRestaurantAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext(); if (!ctx) redirect("/admin");
  const { id } = await params;
  const { data: restaurant } = await ctx.supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!restaurant) notFound();
  return <main className="container-site max-w-4xl py-12"><p className="eyebrow">Admin</p><h1 className="mt-3 mb-8 text-4xl font-semibold">Edit {restaurant.name}</h1><AdminRestaurantForm initial={restaurant} /></main>;
}
