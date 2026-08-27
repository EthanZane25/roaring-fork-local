"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Turnstile } from "@/components/turnstile";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseEnv()) {
      setStatus("Account sign-in is not enabled in this local preview.");
      return;
    }
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "");
    if (mode === "signup") {
      const response = await fetch("/api/account/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName, captchaToken })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setStatus(body.error || "Unable to create account.");
      else setStatus("Account created. Check your email and verify it before voting.");
    } else {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setStatus(result.error.message);
      else {
        setStatus("Signed in.");
        router.refresh();
        router.push("/account");
      }
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="card p-7">
      <div className="mb-6 flex rounded-md bg-[#efeee8] p-1">
        {(["signin","signup"] as const).map((item) => (
          <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === item ? "bg-white shadow-sm" : "text-[#667066]"}`}>
            {item === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      {mode === "signup" ? (
        <label className="mb-4 grid gap-2">
          <span className="text-sm font-bold">Name</span>
          <input name="displayName" required className="rounded-md border border-[#d6d8d1] px-4 py-3" />
        </label>
      ) : null}
      <label className="mb-4 grid gap-2">
        <span className="text-sm font-bold">Email</span>
        <input name="email" type="email" required className="rounded-md border border-[#d6d8d1] px-4 py-3" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-bold">Password</span>
        <input name="password" type="password" minLength={8} required className="rounded-md border border-[#d6d8d1] px-4 py-3" />
      </label>
      {mode === "signup" ? <div className="mt-5"><Turnstile action="signup" onToken={setCaptchaToken} /></div> : null}
      <button disabled={pending} className="mt-6 w-full rounded-md bg-[#163b2d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      {status ? <p className="mt-4 text-sm leading-6 text-[#596159]">{status}</p> : null}
    </form>
  );
}
