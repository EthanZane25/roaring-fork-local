"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

export function AdminBlogPostForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: String(data.get("title") || ""),
        excerpt: String(data.get("excerpt") || ""),
        body: String(data.get("body") || ""),
        town: String(data.get("town") || ""),
        authorName: String(data.get("authorName") || "Roaring Fork Local"),
        status: String(data.get("status") || "draft")
      })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setStatus("Post saved.");
      form.reset();
      window.location.reload();
    } else setStatus(body.error || "Unable to save post.");
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="border border-[#d9dbd5] bg-white p-6">
      <h2 className="text-lg font-semibold">New blog post</h2>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5"><span className="text-xs font-semibold">Title</span><input name="title" required maxLength={180} className="border border-[#cfd2cb] px-3 py-2.5 text-sm" /></label>
        <label className="grid gap-1.5"><span className="text-xs font-semibold">Excerpt</span><textarea name="excerpt" required maxLength={500} rows={3} className="border border-[#cfd2cb] px-3 py-2.5 text-sm" /></label>
        <label className="grid gap-1.5"><span className="text-xs font-semibold">Body</span><textarea name="body" required rows={12} className="border border-[#cfd2cb] px-3 py-2.5 text-sm leading-6" /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5"><span className="text-xs font-semibold">Town</span><select name="town" className="border border-[#cfd2cb] bg-white px-3 py-2.5 text-sm"><option value="">Entire valley</option><option value="aspen">Aspen</option><option value="snowmass-village">Snowmass Village</option><option value="basalt">Basalt / El Jebel</option><option value="carbondale">Carbondale</option><option value="glenwood-springs">Glenwood Springs</option><option value="new-castle">New Castle</option><option value="silt">Silt</option><option value="rifle">Rifle</option></select></label>
          <label className="grid gap-1.5"><span className="text-xs font-semibold">Author</span><input name="authorName" defaultValue="Roaring Fork Local" className="border border-[#cfd2cb] px-3 py-2.5 text-sm" /></label>
          <label className="grid gap-1.5"><span className="text-xs font-semibold">Status</span><select name="status" className="border border-[#cfd2cb] bg-white px-3 py-2.5 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        </div>
      </div>
      <button disabled={pending} className="mt-5 inline-flex items-center gap-2 bg-[#173f30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <Loader2 size={15} className="animate-spin" /> : null} Save post</button>
      {status ? <p className="mt-3 text-sm text-[#626862]">{status}</p> : null}
    </form>
  );
}
