"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Poll } from "@/lib/types";
import { Turnstile } from "@/components/turnstile";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function VotePanel({ poll }: { poll: Poll }) {
  const storageKey = `rfl-vote:${poll.id}`;
  const [selected, setSelected] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    setVotedFor(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  const total = useMemo(() => poll.options.reduce((sum, option) => sum + option.votes, 0), [poll.options]);

  async function vote() {
    if (!selected || pending || votedFor) return;
    setPending(true);
    setStatus("");

    if (!hasSupabaseEnv()) {
      window.localStorage.setItem(storageKey, selected);
      setVotedFor(selected);
      setStatus("Your demo vote was recorded on this device.");
      setPending(false);
      return;
    }

    const response = await fetch("/api/votes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pollId: poll.id, optionId: selected, turnstileToken })
    });
    const body = await response.json().catch(() => ({}));

    if (response.ok) {
      window.localStorage.setItem(storageKey, selected);
      setVotedFor(selected);
      setStatus("Vote recorded.");
    } else {
      setStatus(body.error || "Unable to record vote.");
    }
    setPending(false);
  }

  return (
    <section className="card p-6">
      <p className="eyebrow">Locals' choice</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{poll.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#606860]">{poll.description}</p>

      <div className="mt-6 grid gap-3">
        {poll.options.map((option) => {
          const percent = total ? Math.round((option.votes / total) * 100) : 0;
          const chosen = votedFor === option.id;
          return (
            <label key={option.id} className={`relative overflow-hidden rounded-2xl border p-4 ${chosen ? "border-[#2e6e4d] bg-[#eff6f1]" : "border-[#dcded7] bg-white"}`}>
              <div className="absolute inset-y-0 left-0 bg-[#edf1ec]" style={{ width: `${percent}%` }} />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <input type="radio" name={poll.id} value={option.id} disabled={Boolean(votedFor)} checked={selected === option.id} onChange={() => setSelected(option.id)} />
                  <strong>{option.label}</strong>
                  {chosen ? <CheckCircle2 size={17} className="text-[#286545]" /> : null}
                </span>
                <span className="text-xs font-bold text-[#5f675f]">{percent}% · {option.votes.toLocaleString()}</span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-5"><Turnstile action="vote" onToken={setTurnstileToken} /></div>
      <button
        onClick={vote}
        disabled={!selected || Boolean(votedFor) || pending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#163b2d] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        {votedFor ? "Vote recorded" : "Cast my vote"}
      </button>
      {status ? <p className="mt-3 text-center text-xs text-[#5b635b]">{status}</p> : null}
      <p className="mt-4 text-center text-[11px] leading-5 text-[#747b74]">
        Production voting requires a signed-in account and is enforced by a database uniqueness constraint.
      </p>
    </section>
  );
}
