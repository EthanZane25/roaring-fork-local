"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseEnv()) {
      setStatus("Supabase is not connected yet. The public site is running in demo mode.");
      return;
    }
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "");
    const supabase = createClient();

    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });

    if (result.error) setStatus(result.error.message);
    else {
      setStatus(mode === "signin" ? "Signed in." : "Account created. Check your email if confirmation is enabled.");
      router.refresh();
      if (mode === "signin") router.push("/account");
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="card p-7">
      <div className="mb-6 flex rounded-xl bg-[#efeee8] p-1">
        {(["signin","signup"] as const).map((item) => (
          <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-black ${mode === item ? "bg-white shadow-sm" : "text-[#667066]"}`}>
            {item === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      {mode === "signup" ? (
        <label className="mb-4 grid gap-2">
          <span className="text-sm font-bold">Name</span>
          <input name="displayName" required className="rounded-xl border border-[#d6d8d1] px-4 py-3" />
        </label>
      ) : null}
      <label className="mb-4 grid gap-2">
        <span className="text-sm font-bold">Email</span>
        <input name="email" type="email" required className="rounded-xl border border-[#d6d8d1] px-4 py-3" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold">Password</span>
        <input name="password" type="password" minLength={8} required className="rounded-xl border border-[#d6d8d1] px-4 py-3" />
      </label>
      <button disabled={pending} className="mt-6 w-full rounded-xl bg-[#163b2d] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
        {pending ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      {status ? <p className="mt-4 text-sm leading-6 text-[#596159]">{status}</p> : null}
    </form>
  );
}
