"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TOWNS } from "@/lib/constants";

type RestaurantFormData = {
  id?: string;
  name?: string;
  slug?: string;
  town_slug?: string;
  address?: string;
  description?: string;
  cuisines?: string[];
  meals?: string[];
  search_tags?: string[];
  price_level?: number;
  image_url?: string;
  is_advertiser?: boolean;
  phone?: string;
  website?: string;
  published?: boolean;
};

export function AdminRestaurantForm({ initial }: { initial?: RestaurantFormData }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      slug: String(form.get("slug") || "").trim(),
      townSlug: String(form.get("town") || ""),
      address: String(form.get("address") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      website: String(form.get("website") || "").trim(),
      description: String(form.get("description") || "").trim(),
      cuisines: String(form.get("cuisines") || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      meals: String(form.get("meals") || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      tags: String(form.get("tags") || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      priceLevel: Number(form.get("priceLevel") || 2),
      imageUrl: String(form.get("imageUrl") || "").trim(),
      isAdvertiser: form.get("isAdvertiser") === "on",
      published: form.get("published") === "on"
    };

    const url = initial?.id ? `/api/admin/restaurants/${initial.id}` : "/api/admin/restaurants";
    const response = await fetch(url, {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setStatus(body.error || "Unable to save restaurant.");
    else {
      setStatus("Saved.");
      router.push("/admin/restaurants");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="card p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="text-sm font-bold">Name</span><input name="name" required defaultValue={initial?.name} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Slug</span><input name="slug" required defaultValue={initial?.slug} className="rounded-md border border-[#d6d8d1] px-4 py-3" placeholder="restaurant-name" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Town</span><select name="town" defaultValue={initial?.town_slug || "aspen"} className="rounded-md border border-[#d6d8d1] px-4 py-3">{TOWNS.map((town)=><option key={town.slug} value={town.slug}>{town.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Price level</span><select name="priceLevel" defaultValue={initial?.price_level || 2} className="rounded-md border border-[#d6d8d1] px-4 py-3">{[1,2,3,4].map((n)=><option key={n} value={n}>{"$".repeat(n)}</option>)}</select></label>
        <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-bold">Address</span><input name="address" required defaultValue={initial?.address} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Phone</span><input name="phone" defaultValue={initial?.phone} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Website</span><input name="website" type="url" defaultValue={initial?.website} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-bold">Description</span><textarea name="description" rows={5} defaultValue={initial?.description} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Cuisines, comma separated</span><input name="cuisines" defaultValue={initial?.cuisines?.join(", ")} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2"><span className="text-sm font-bold">Meals, comma separated</span><input name="meals" defaultValue={initial?.meals?.join(", ")} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-bold">Search tags, comma separated</span><input name="tags" defaultValue={initial?.search_tags?.join(", ")} className="rounded-md border border-[#d6d8d1] px-4 py-3" /></label>
        <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-bold">Image URL</span><input name="imageUrl" type="url" defaultValue={initial?.image_url} className="rounded-md border border-[#d6d8d1] px-4 py-3" /><span className="text-xs font-normal text-[#687069]">Restaurant photos are shown publicly only for paid advertisers.</span></label>
        <label className="flex items-start gap-2 border border-[#d9dcd5] bg-[#f7f6f2] p-4 text-sm sm:col-span-2"><input name="isAdvertiser" type="checkbox" defaultChecked={initial?.is_advertiser ?? false} className="mt-0.5" /><span><strong className="block">Paid advertiser</strong><span className="mt-1 block text-xs font-normal leading-5 text-[#687069]">Enables sponsored photo placement for this restaurant. Free listings remain text-only.</span></span></label>
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input name="published" type="checkbox" defaultChecked={initial?.published ?? true} /> Published</label>
      </div>
      <button disabled={pending} className="mt-6 rounded-md bg-[#163b2d] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving..." : "Save restaurant"}</button>
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
    </form>
  );
}
