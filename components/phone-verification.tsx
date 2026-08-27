"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Turnstile } from "@/components/turnstile";

export function PhoneVerification({ verified, last4 }: { verified: boolean; last4?: string | null }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  if (verified) {
    return (
      <div className="border border-[#d9dbd5] bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#173f30]"><CheckCircle2 size={17} /> Mobile number verified</div>
        <p className="mt-2 text-sm text-[#626862]">Number ending in {last4 || "••••"}</p>
        <p className="mt-2 text-xs leading-5 text-[#737a74]">Your verified number is stored in normalized E.164 form so one phone can belong to only one voting account.</p>
      </div>
    );
  }

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const response = await fetch("/api/phone/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, turnstileToken })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setPhone(body.phone || phone);
      setStage("code");
      setStatus("A verification code was sent by SMS.");
    } else setStatus(body.error || "Unable to send code.");
    setPending(false);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const response = await fetch("/api/phone/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setStatus("Mobile number verified. Refreshing your account...");
      window.location.reload();
    } else setStatus(body.error || "Unable to verify code.");
    setPending(false);
  }

  return (
    <div className="border border-[#d9dbd5] bg-white p-5">
      <h2 className="text-base font-semibold">Verify your mobile number</h2>
      <p className="mt-2 text-sm leading-6 text-[#626862]">A verified mobile number is required for live voting. One verified number can be attached to only one account.</p>
      {stage === "phone" ? (
        <form onSubmit={requestCode} className="mt-4 grid gap-3">
          <label className="grid gap-1.5"><span className="text-xs font-semibold">Mobile number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="970-555-0123" className="border border-[#cfd2cb] bg-white px-3 py-2.5 text-sm" /></label>
          <Turnstile action="phone_verify" onToken={setTurnstileToken} />
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <Loader2 size={15} className="animate-spin" /> : null} Send code</button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-4 grid gap-3">
          <p className="text-xs text-[#6c736d]">Code sent to {phone}</p>
          <label className="grid gap-1.5"><span className="text-xs font-semibold">Verification code</span><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))} required inputMode="numeric" autoComplete="one-time-code" className="border border-[#cfd2cb] bg-white px-3 py-2.5 text-sm" /></label>
          <button disabled={pending || code.length < 4} className="inline-flex items-center justify-center gap-2 bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <Loader2 size={15} className="animate-spin" /> : null} Verify number</button>
          <button type="button" onClick={() => setStage("phone")} className="text-left text-sm font-medium text-[#4e5951] underline">Use a different number</button>
        </form>
      )}
      {status ? <p className="mt-3 text-xs leading-5 text-[#656c66]">{status}</p> : null}
    </div>
  );
}
