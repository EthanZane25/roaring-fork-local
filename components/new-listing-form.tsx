"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MARKETPLACE_CATEGORIES, TOWNS, titleize } from "@/lib/constants";
import { Turnstile } from "@/components/turnstile";

export function NewListingForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/listings", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(body.error || "Unable to submit listing.");
      setPending(false);
      return;
    }

    if (body.listing?.slug) {
      router.push(`/marketplace/${body.listing.slug}`);
      router.refresh();
      return;
    }

    setStatus(body.message || "Listing submitted successfully.");
    event.currentTarget.reset();
    setPending(false);
  }

  const inputClass = "rounded-xl border border-[#d8ddd8] bg-white px-4 py-3 outline-none transition focus:border-[#2f6b52] focus:shadow-[0_0_0_3px_rgba(47,107,82,0.08)]";

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-bold">Title</span>
          <input name="title" required maxLength={100} className={inputClass} placeholder="What are you selling?" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold">Price</span>
          <input name="price" type="number" min="0" step="1" required className={inputClass} placeholder="0 for free" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold">Town</span>
          <select name="town" required className={inputClass}>
            {TOWNS.map((town) => <option key={town.slug} value={town.slug}>{town.name}</option>)}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold">Category</span>
          <select name="category" required className={inputClass}>
            {MARKETPLACE_CATEGORIES.map((category) => <option key={category} value={category}>{titleize(category)}</option>)}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold">Primary photo</span>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
        </label>

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-bold">Description</span>
          <textarea name="description" required maxLength={4000} rows={6} className={inputClass} placeholder="Condition, pickup details, size, etc." />
        </label>
      </div>

      <div className="mt-5"><Turnstile action="create_listing" /></div>

      <button disabled={pending} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#123c2f] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
        {pending ? <Loader2 size={16} className="animate-spin" /> : null} Publish listing
      </button>

      {status ? <p className="mt-4 text-sm font-semibold text-[#59635c]">{status}</p> : null}
    </form>
  );
}
