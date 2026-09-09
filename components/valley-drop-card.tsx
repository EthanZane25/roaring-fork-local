"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  MapPin,
  TicketCheck,
  Zap
} from "lucide-react";

type ValleyDrop = {
  id: string;
  business_name: string;
  business_type: string;
  town_slug: string;
  address: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number | null;
  regular_price: number | null;
  quantity_total: number;
  starts_at: string;
  ends_at: string;
  state: string;
  claimed_count: number;
  remaining: number;
};

function discountLabel(drop: ValleyDrop) {
  const value = Number(
    drop.discount_value || 0
  );

  if (drop.discount_type === "percentage") {
    return `${value}% OFF`;
  }

  if (drop.discount_type === "fixed_amount") {
    return `$${value.toLocaleString()} OFF`;
  }

  if (drop.discount_type === "fixed_price") {
    return `$${value.toLocaleString()} DEAL`;
  }

  if (drop.discount_type === "bogo") {
    return "BUY ONE, GET ONE";
  }

  return "FREE ITEM";
}

function mountainTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export function ValleyDropCard({
  drop
}: {
  drop: ValleyDrop;
}) {
  const [now, setNow] = useState(
    Date.now()
  );

  const [remaining, setRemaining] =
    useState(drop.remaining);

  const [pending, setPending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [claim, setClaim] =
    useState<{
      claim_code: string;
      secret_word: string;
    } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now()),
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  const start =
    new Date(drop.starts_at).getTime();

  const end =
    new Date(drop.ends_at).getTime();

  const live =
    now >= start &&
    now < end &&
    remaining > 0;

  const scheduled =
    now < start;

  const soldOut =
    remaining <= 0;

  const seconds = Math.max(
    0,
    Math.ceil((end - now) / 1000)
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const secs = seconds % 60;

  async function claimDeal() {
    setPending(true);
    setMessage("");

    const response = await fetch(
      `/api/deals/${drop.id}/claim`,
      {
        method: "POST"
      }
    );

    const body = await response
      .json()
      .catch(() => ({}));

    if (response.status === 401) {
      window.location.href =
        `/sign-in?next=${encodeURIComponent(
          "/deals"
        )}`;
      return;
    }

    if (!response.ok) {
      setMessage(
        body.error ||
          "Unable to claim this deal."
      );
    } else if (body.claim) {
      setClaim({
        claim_code:
          body.claim.claim_code,
        secret_word:
          body.claim.secret_word
      });

      setRemaining(
        Number(
          body.claim.remaining ??
            remaining
        )
      );
    }

    setPending(false);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#dedfd9] bg-white">
      <div className="border-b border-[#e3e4de] bg-[#173f30] px-5 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.13em]">
            <Zap size={15} />
            Valley Drop
          </span>

          {live ? (
            <span className="text-xs font-bold">
              {minutes}:
              {String(secs).padStart(
                2,
                "0"
              )} left
            </span>
          ) : scheduled ? (
            <span className="text-xs font-semibold">
              Starts{" "}
              {mountainTime(
                drop.starts_at
              )} MT
            </span>
          ) : (
            <span className="text-xs font-semibold">
              Ended
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#8b6b22]">
          {discountLabel(drop)}
        </p>

        <h2 className="mt-2 font-serif text-2xl leading-tight">
          {drop.title}
        </h2>

        <p className="mt-2 text-sm font-semibold text-[#354238]">
          {drop.business_name}
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#737b75]">
          <MapPin size={12} />
          {drop.address}
        </p>

        {drop.description ? (
          <p className="mt-4 text-sm leading-6 text-[#626a64]">
            {drop.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-[#e5e6e0] py-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <TicketCheck size={15} />
            {remaining} of 25 left
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={15} />
            60-minute drop
          </span>
        </div>

        {claim ? (
          <div className="mt-5 rounded-xl border-2 border-[#173f30] bg-[#f4f7f3] p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#687169]">
              Your secret word
            </p>

            <p className="mt-2 text-3xl font-bold tracking-[.08em] text-[#173f30]">
              {claim.secret_word}
            </p>

            <p className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-[#687169]">
              Claim code
            </p>

            <p className="mt-1 text-xl font-bold tracking-[.18em]">
              {claim.claim_code}
            </p>

            <p className="mt-4 text-xs leading-5 text-[#687169]">
              Show this screen at the participating business before the deal expires.
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={
              pending ||
              !live ||
              soldOut
            }
            onClick={claimDeal}
            className="mt-5 min-h-12 w-full rounded-lg bg-[#173f30] px-5 py-3 text-sm font-bold text-white disabled:bg-[#c5c9c4]"
          >
            {pending
              ? "Claiming..."
              : soldOut
                ? "Sold out"
                : scheduled
                  ? "Coming soon"
                  : live
                    ? "Claim Valley Drop"
                    : "Deal ended"}
          </button>
        )}

        {message ? (
          <p className="mt-3 text-sm text-[#8a482d]">
            {message}
          </p>
        ) : null}
      </div>
    </article>
  );
}
