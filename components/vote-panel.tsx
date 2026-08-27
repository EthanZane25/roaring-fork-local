"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Contest } from "@/lib/types";
import { getTown } from "@/lib/constants";
import { Turnstile } from "@/components/turnstile";

type Eligibility = {
  state: "loading" | "logged_out" | "unverified" | "can_vote" | "already_voted" | "closed" | "ineligible";
  needs?: string[];
  contestId?: string;
  restaurantId?: string;
  restaurantName?: string;
  voteStatus?: string;
  productionVoting?: boolean;
};

type Result = { restaurantId: string; name: string; votes: number };

export function VotePanel({ contest }: { contest: Contest }) {
  const [eligibility, setEligibility] = useState<Eligibility>({ state: "loading" });
  const [selected, setSelected] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>(contest.restaurants.map((restaurant) => ({ restaurantId: restaurant.restaurantId, name: restaurant.name, votes: restaurant.votes })));

  const endDate = useMemo(() => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" }).format(new Date(contest.endsAt)), [contest.endsAt]);
  const total = useMemo(() => results.reduce((sum, result) => sum + result.votes, 0), [results]);
  const voteMap = useMemo(() => new Map(results.map((result) => [result.restaurantId, result.votes])), [results]);
  const visibleRestaurants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? contest.restaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(needle) || getTown(restaurant.town)?.name.toLowerCase().includes(needle)) : contest.restaurants;
  }, [contest.restaurants, query]);

  async function refreshResults() {
    const response = await fetch(`/api/contests/${encodeURIComponent(contest.slug)}/results`, { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.results) setResults(body.results);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/votes/me?contest=${encodeURIComponent(contest.slug)}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/contests/${encodeURIComponent(contest.slug)}/results`, { cache: "no-store" }).then((response) => response.json())
    ]).then(([me, resultBody]) => {
      if (cancelled) return;
      setEligibility(me);
      if (me?.restaurantId) setSelected(me.restaurantId);
      if (resultBody?.results) setResults(resultBody.results);
    }).catch(() => {
      if (!cancelled) setEligibility({ state: "logged_out" });
    });
    return () => { cancelled = true; };
  }, [contest.slug]);

  async function castVote() {
    if (!selected || pending) return;
    setPending(true);
    setStatus("");
    const response = await fetch("/api/votes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contestId: contest.id,
        restaurantId: selected,
        turnstileToken,
        clientSignals: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          screen: `${window.screen.width}x${window.screen.height}`
        }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error || "Unable to record your vote.");
      setPending(false);
      return;
    }

    const chosen = contest.restaurants.find((restaurant) => restaurant.restaurantId === selected);
    setEligibility({ state: "already_voted", contestId: contest.id, restaurantId: selected, restaurantName: chosen?.name || "Restaurant", voteStatus: body.held ? "held" : "counted", productionVoting: true });
    setEditing(false);
    setStatus(body.message || "Vote recorded.");
    setTurnstileToken("");
    await refreshResults();
    setPending(false);
  }

  const isChanging = eligibility.state === "already_voted" && editing;
  const canChoose = eligibility.state === "can_vote" || isChanging;

  return (
    <section id={contest.slug} className="scroll-mt-24 border border-[#d9dbd5] bg-white p-5 sm:p-6">
      <h2 className="text-2xl font-semibold tracking-[-0.025em]">{contest.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#606660]">One vote per person. You can change it until {endDate}. Sign in to vote.</p>

      {contest.restaurants.length > 12 ? (
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search eligible restaurants" className="mt-5 h-10 w-full border border-[#cfd2cb] bg-white px-3 text-sm" />
      ) : null}

      <div className="mt-5 divide-y divide-[#e4e5df] border-y border-[#e4e5df]">
        {visibleRestaurants.map((restaurant) => {
          const votes = voteMap.get(restaurant.restaurantId) ?? 0;
          const percent = total ? (votes / total) * 100 : 0;
          const chosen = eligibility.state === "already_voted" && eligibility.restaurantId === restaurant.restaurantId;
          return (
            <label key={restaurant.restaurantId} className={`block py-3 ${canChoose ? "cursor-pointer" : "cursor-default"}`}>
              <div className="flex items-start gap-3">
                {canChoose ? <input type="radio" name={contest.id} value={restaurant.restaurantId} checked={selected === restaurant.restaurantId} onChange={() => setSelected(restaurant.restaurantId)} className="mt-1" /> : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold">{restaurant.name}</span>
                    {chosen ? <CheckCircle2 size={15} className="text-[#276044]" /> : null}
                  </div>
                  <span className="mt-0.5 block text-[12px] text-[#7a807a]">{getTown(restaurant.town)?.name}</span>
                </div>
                <span className="shrink-0 text-right text-[12px] text-[#5f655f]">{percent.toFixed(1)}% · {votes.toLocaleString()} votes</span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-5">
        {eligibility.state === "loading" ? <p className="text-sm text-[#6b716c]">Checking your voting status…</p> : null}
        {eligibility.state === "logged_out" ? <Link href="/sign-in" className="inline-flex bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white">Sign in to vote</Link> : null}
        {eligibility.state === "unverified" ? (
          <div>
            <p className="text-sm text-[#5f665f]">Verify {eligibility.needs?.join(" and ") || "your account"} to vote.</p>
            <Link href="/account" className="mt-3 inline-flex border border-[#bfc7c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#173f30]">Verify email / phone to vote</Link>
          </div>
        ) : null}
        {eligibility.state === "can_vote" || isChanging ? (
          <div>
            <Turnstile action="vote" onToken={setTurnstileToken} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={castVote} disabled={!selected || pending} className="inline-flex items-center justify-center gap-2 bg-[#173f30] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
                {pending ? <Loader2 size={15} className="animate-spin" /> : null}
                {isChanging ? "Update vote" : "Cast vote"}
              </button>
              {isChanging ? <button type="button" onClick={() => { setEditing(false); setSelected(eligibility.restaurantId || ""); }} className="border border-[#cfd2cb] px-4 py-2.5 text-sm font-semibold">Cancel</button> : null}
            </div>
          </div>
        ) : null}
        {eligibility.state === "already_voted" && !editing ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#3f6b54] pl-4">
            <div>
              <p className="text-sm font-semibold">Your vote: {eligibility.restaurantName}</p>
              {eligibility.voteStatus === "held" ? <p className="mt-1 text-xs text-[#707771]">This vote is under verification and is not included in public totals yet.</p> : null}
            </div>
            <button type="button" onClick={() => setEditing(true)} className="border border-[#bfc7c0] bg-white px-4 py-2 text-sm font-semibold text-[#173f30]">Change vote</button>
          </div>
        ) : null}
        {eligibility.state === "closed" ? <p className="text-sm text-[#606760]">This contest is closed.</p> : null}
        {eligibility.state === "ineligible" ? <p className="text-sm text-[#606760]">This account is not eligible to vote.</p> : null}
      </div>

      {status ? <p className="mt-4 text-sm text-[#5b615c]">{status}</p> : null}
    </section>
  );
}
