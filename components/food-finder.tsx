"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, MapPin, RotateCcw, Shuffle, X } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { getTown, TOWNS, titleize } from "@/lib/constants";

type Answers = {
  town: string;
  meal: string;
  price: number;
  cuisine: string;
  preference: string;
  openNow: boolean;
};

type FoodFinderProps = {
  restaurants: Restaurant[];
  open: boolean;
  onClose: () => void;
};

const DEFAULT_ANSWERS: Answers = {
  town: "",
  meal: "",
  price: 0,
  cuisine: "",
  preference: "",
  openNow: false
};

const QUESTIONS = ["town", "meal", "price", "cuisine", "preference", "open"] as const;

export function FoodFinder({ restaurants, open, onClose }: FoodFinderProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [showResults, setShowResults] = useState(false);
  const [surpriseSeed, setSurpriseSeed] = useState(0);

  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const restaurant of restaurants) {
      for (const cuisine of restaurant.cuisines) counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([cuisine]) => cuisine);
  }, [restaurants]);

  const preferences = useMemo(() => {
    const preferred = ["outdoor-dining", "family-friendly", "happy-hour", "burgers", "coffee"];
    const available = new Set(restaurants.flatMap((restaurant) => restaurant.tags));
    return preferred.filter((item) => available.has(item));
  }, [restaurants]);

  const recommendations = useMemo(() => rankRestaurants(restaurants, answers, surpriseSeed), [restaurants, answers, surpriseSeed]);

  if (!open) return null;

  function choose<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    if (step >= QUESTIONS.length - 1) setShowResults(true);
    else setStep((current) => current + 1);
  }

  function reset() {
    setAnswers(DEFAULT_ANSWERS);
    setStep(0);
    setShowResults(false);
    setSurpriseSeed(0);
  }

  function close() {
    reset();
    onClose();
  }

  const progress = showResults ? 100 : Math.round(((step + 1) / QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="food-finder-title">
      <div className="max-h-[92vh] w-full overflow-y-auto bg-[#fbfaf7] sm:max-w-2xl sm:border sm:border-[#cfd2cc]">
        <div className="sticky top-0 z-10 border-b border-[#dfe1db] bg-[#fbfaf7] px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#a94f32]">Restaurant finder</p>
              <h2 id="food-finder-title" className="mt-1 text-xl font-semibold">Let’s narrow it down.</h2>
            </div>
            <button type="button" onClick={close} className="p-2 text-[#606760]" aria-label="Close restaurant finder"><X size={20} /></button>
          </div>
          <div className="mt-4 h-1 bg-[#e1e3dd]"><div className="h-full bg-[#315e49] transition-all" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="p-5 sm:p-7">
          {showResults ? (
            <FinderResults
              recommendations={recommendations}
              onReset={reset}
              onSurprise={() => setSurpriseSeed((seed) => seed + 1)}
            />
          ) : (
            <>
              {step === 0 ? (
                <Question title="Where do you want to eat?" helper="Choose a town or search the whole valley.">
                  <Choice label="Anywhere in the valley" onClick={() => choose("town", "")} />
                  {TOWNS.map((town) => <Choice key={town.slug} label={town.name} onClick={() => choose("town", town.slug)} />)}
                </Question>
              ) : null}

              {step === 1 ? (
                <Question title="What are you looking for?" helper="Pick the meal that best fits right now.">
                  <Choice label="Anything" onClick={() => choose("meal", "")} />
                  {[
                    ["breakfast", "Breakfast"],
                    ["brunch", "Brunch"],
                    ["lunch", "Lunch"],
                    ["dinner", "Dinner"]
                  ].map(([value, label]) => <Choice key={value} label={label} onClick={() => choose("meal", value)} />)}
                </Question>
              ) : null}

              {step === 2 ? (
                <Question title="What kind of budget?" helper="This is the restaurant’s general price level, not an exact meal cost.">
                  <Choice label="Any price" onClick={() => choose("price", 0)} />
                  <Choice label="$ — inexpensive" onClick={() => choose("price", 1)} />
                  <Choice label="$$ — moderate" onClick={() => choose("price", 2)} />
                  <Choice label="$$$ — higher end" onClick={() => choose("price", 3)} />
                  <Choice label="$$$$ — special occasion" onClick={() => choose("price", 4)} />
                </Question>
              ) : null}

              {step === 3 ? (
                <Question title="What sounds good?" helper="Skip this if you are open to anything.">
                  <Choice label="No preference" onClick={() => choose("cuisine", "")} />
                  {cuisines.map((cuisine) => <Choice key={cuisine} label={titleize(cuisine)} onClick={() => choose("cuisine", cuisine)} />)}
                </Question>
              ) : null}

              {step === 4 ? (
                <Question title="Anything else that matters?" helper="We’ll use this as a preference, not a hard rule.">
                  <Choice label="No preference" onClick={() => choose("preference", "")} />
                  {preferences.map((preference) => <Choice key={preference} label={titleize(preference)} onClick={() => choose("preference", preference)} />)}
                </Question>
              ) : null}

              {step === 5 ? (
                <Question title="Does it need to be open right now?" helper="You can still see strong matches that are currently closed if you choose no.">
                  <Choice label="Yes, open now only" onClick={() => choose("openNow", true)} />
                  <Choice label="No, show the best matches" onClick={() => choose("openNow", false)} />
                </Question>
              ) : null}

              {step > 0 ? (
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#315e49] hover:underline">
                  <ArrowLeft size={15} /> Back
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Question({ title, helper, children }: { title: string; helper: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#626962]">{helper}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Choice({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="border border-[#cfd2cc] bg-white px-4 py-3 text-left text-sm font-medium hover:border-[#789080] hover:bg-[#f6f7f4]">
      {label}
    </button>
  );
}

function FinderResults({
  recommendations,
  onReset,
  onSurprise
}: {
  recommendations: { restaurant: Restaurant; score: number; exact: boolean }[];
  onReset: () => void;
  onSurprise: () => void;
}) {
  const top = recommendations.slice(0, 3);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#a94f32]">Your matches</p>
          <h3 className="mt-1 text-2xl font-semibold">Here are three places to start.</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#626962]">The finder ranks the current restaurant database by your answers and local votes. If a perfect match is unavailable, it shows the closest alternatives.</p>
        </div>
      </div>

      {top.length ? (
        <div className="mt-6 divide-y divide-[#dfe1db] border-y border-[#dfe1db]">
          {top.map(({ restaurant, exact }, index) => (
            <article key={restaurant.id} className="py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#667067]">#{index + 1}</span>
                    <Link href={`/restaurants/${restaurant.slug}`} className="text-lg font-semibold hover:underline">{restaurant.name}</Link>
                    {index === 0 ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#315e49]"><Check size={13} /> Best match</span> : null}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#656b65]">
                    <span className="inline-flex items-center gap-1"><MapPin size={13} /> {getTown(restaurant.town)?.name}</span>
                    <span>·</span>
                    <span>{restaurant.cuisines.slice(0, 2).map(titleize).join(" · ")}</span>
                    <span>·</span>
                    <span>{"$".repeat(restaurant.priceLevel)}</span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#555c56]">{restaurant.description}</p>
                  {!exact ? <p className="mt-2 text-xs text-[#87664f]">Closest available match — one or more preferences were relaxed.</p> : null}
                </div>
              </div>
              <Link href={`/restaurants/${restaurant.slug}`} className="mt-3 inline-block text-sm font-semibold text-[#315e49] hover:underline">View restaurant →</Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 border-y border-[#dfe1db] py-8 text-sm text-[#606760]">We do not have enough restaurant data for those preferences yet.</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onSurprise} className="inline-flex items-center gap-2 bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3225]"><Shuffle size={15} /> Surprise me</button>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-2 border border-[#bcc1ba] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f2]"><RotateCcw size={15} /> Start over</button>
      </div>
    </section>
  );
}

function rankRestaurants(restaurants: Restaurant[], answers: Answers, surpriseSeed: number) {
  const strictMatches = restaurants.filter((restaurant) => {
    if (answers.town && restaurant.town !== answers.town) return false;
    if (answers.meal && !restaurant.meals.includes(answers.meal)) return false;
    if (answers.price && restaurant.priceLevel !== answers.price) return false;
    if (answers.cuisine && !restaurant.cuisines.includes(answers.cuisine)) return false;
    if (answers.openNow && restaurant.openNow !== true) return false;
    return true;
  });

  const source = strictMatches.length >= 3 ? strictMatches : restaurants;

  return source
    .map((restaurant) => {
      let score = Math.log10(Math.max(10, restaurant.localVotes)) * 8;
      let exact = true;

      if (answers.town) {
        if (restaurant.town === answers.town) score += 35;
        else { score -= 20; exact = false; }
      }
      if (answers.meal) {
        if (restaurant.meals.includes(answers.meal)) score += 24;
        else { score -= 14; exact = false; }
      }
      if (answers.price) {
        const difference = Math.abs(restaurant.priceLevel - answers.price);
        if (difference === 0) score += 18;
        else { score -= difference * 7; exact = false; }
      }
      if (answers.cuisine) {
        if (restaurant.cuisines.includes(answers.cuisine)) score += 30;
        else { score -= 16; exact = false; }
      }
      if (answers.preference) {
        if (restaurant.tags.includes(answers.preference)) score += 14;
        else exact = false;
      }
      if (answers.openNow) {
        if (restaurant.openNow === true) score += 25;
        else { score -= 40; exact = false; }
      }

      // Deterministic nudge lets "Surprise me" reshuffle close matches without returning poor fits.
      score += (((restaurant.id.charCodeAt(restaurant.id.length - 1) + surpriseSeed * 13) % 17) / 16) * 10;
      return { restaurant, score, exact };
    })
    .toSorted((a, b) => b.score - a.score);
}
