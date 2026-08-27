"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Turnstile } from "@/components/turnstile";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function BlogSuggestionForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!hasSupabaseEnv()) {
      setStatus("Suggestion form is ready. Connect Supabase to save submissions.");
      setPending(false);
      return;
    }

    const response = await fetch("/api/blog/suggestions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        town: String(data.get("town") || ""),
        subject: String(data.get("subject") || ""),
        suggestion: String(data.get("suggestion") || ""),
        company: String(data.get("company") || ""),
        turnstileToken
      })
    });

    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      form.reset();
      setTurnstileToken("");
      setStatus("Thanks. Your suggestion was sent to the editors for review.");
    } else {
      setStatus(body.error || "Unable to send your suggestion.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="border border-[#d9dbd5] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Send a local suggestion</h2>
      <p className="mt-2 text-sm leading-6 text-[#626862]">Tell us about a restaurant, event, local issue, useful resource or story we should look into. Suggestions are reviewed before publication.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold">Name</span>
          <input name="name" maxLength={100} className="border border-[#cfd2cb] px-3 py-2.5 text-sm" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold">Email <span className="font-normal text-[#777d78]">(optional)</span></span>
          <input name="email" type="email" maxLength={200} className="border border-[#cfd2cb] px-3 py-2.5 text-sm" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold">Town</span>
          <select name="town" className="border border-[#cfd2cb] bg-white px-3 py-2.5 text-sm">
            <option value="">Entire valley / other</option>
            <option value="aspen">Aspen</option>
            <option value="snowmass-village">Snowmass Village</option>
            <option value="basalt">Basalt / El Jebel</option>
            <option value="carbondale">Carbondale</option>
            <option value="glenwood-springs">Glenwood Springs</option>
            <option value="new-castle">New Castle</option>
            <option value="silt">Silt</option>
            <option value="rifle">Rifle</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold">Subject</span>
          <input name="subject" required minLength={4} maxLength={160} className="border border-[#cfd2cb] px-3 py-2.5 text-sm" />
        </label>
      </div>

      <label className="mt-4 grid gap-1.5">
        <span className="text-xs font-semibold">Suggestion</span>
        <textarea name="suggestion" required minLength={20} maxLength={4000} rows={6} className="resize-y border border-[#cfd2cb] px-3 py-2.5 text-sm leading-6" />
      </label>

      <label className="sr-only" aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="mt-4"><Turnstile action="blog_suggestion" onToken={setTurnstileToken} /></div>
      <button disabled={pending} className="mt-4 inline-flex items-center justify-center gap-2 bg-[#173f30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? <Loader2 size={15} className="animate-spin" /> : null} Send suggestion
      </button>
      {status ? <p className="mt-3 text-sm leading-6 text-[#626862]">{status}</p> : null}
    </form>
  );
}
