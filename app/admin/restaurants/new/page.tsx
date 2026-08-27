import { redirect } from "next/navigation";
import { AdminRestaurantForm } from "@/components/admin-restaurant-form";
import { getAdminContext } from "@/lib/admin";

export default async function NewRestaurantAdminPage() {
  if (!await getAdminContext()) redirect("/admin");
  return <main className="container-site max-w-4xl py-12"><p className="eyebrow">Admin</p><h1 className="mt-3 mb-8 text-4xl font-semibold">Add restaurant</h1><AdminRestaurantForm /></main>;
}
