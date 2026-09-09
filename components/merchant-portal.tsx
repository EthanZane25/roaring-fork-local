"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock3,
  KeyRound,
  Store,
  TicketCheck
} from "lucide-react";

import { TOWNS, getTown } from "@/lib/constants";

type MerchantBusiness = {
  id: string;
  business_name: string;
  business_type: string;
  town_slug: string;
  address: string;
  status: string;
};

type MerchantDeal = {
  id: string;
  business_id: string;
  title: string;
  discount_type: string;
  discount_value: number | null;
  regular_price: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  secretWord?: string;
  claimCount: number;
  redeemedCount: number;
};

function discountLabel(deal: MerchantDeal) {
  const value = Number(deal.discount_value || 0);

  if (deal.discount_type === "percentage") {
    return `${value}% off`;
  }

  if (deal.discount_type === "fixed_amount") {
    return `$${value.toLocaleString()} off`;
  }

  if (deal.discount_type === "fixed_price") {
    return `$${value.toLocaleString()} special`;
  }

  if (deal.discount_type === "bogo") {
    return "Buy one, get one";
  }

  return "Free item";
}

function mountainTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver"
  }).format(new Date(value));
}

export function MerchantPortal({
  businesses,
  deals
}: {
  businesses: MerchantBusiness[];
  deals: MerchantDeal[];
}) {
  const router = useRouter();

  const [applicationStatus, setApplicationStatus] = useState("");
  const [dealStatus, setDealStatus] = useState("");
  const [redeemStatus, setRedeemStatus] = useState("");

  const [pendingApplication, setPendingApplication] = useState(false);
  const [pendingDeal, setPendingDeal] = useState(false);
  const [pendingRedeem, setPendingRedeem] = useState(false);

  const approved = businesses.filter(
    business => business.status === "approved"
  );

  const pending = businesses.filter(
    business => business.status === "pending"
  );

  async function applyForMerchant(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPendingApplication(true);
    setApplicationStatus("");

    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/merchant/businesses", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        businessName: String(form.get("businessName") || ""),
        businessType: String(form.get("businessType") || ""),
        townSlug: String(form.get("townSlug") || ""),
        address: String(form.get("address") || "")
      })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setApplicationStatus(
        body.error || "Unable to submit merchant application."
      );
    } else {
      setApplicationStatus(
        "Application submitted for review."
      );
      router.refresh();
    }

    setPendingApplication(false);
  }

  async function createDeal(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPendingDeal(true);
    setDealStatus("");

    const form = new FormData(event.currentTarget);

    const rawStart = String(
      form.get("startsAt") || ""
    );

    const startDate = new Date(rawStart);

    if (
      !rawStart ||
      Number.isNaN(startDate.getTime())
    ) {
      setDealStatus("Choose a valid start date and time.");
      setPendingDeal(false);
      return;
    }

    const discountRaw = String(
      form.get("discountValue") || ""
    ).trim();

    const regularRaw = String(
      form.get("regularPrice") || ""
    ).trim();

    const response = await fetch("/api/merchant/deals", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        businessId: String(
          form.get("businessId") || ""
        ),
        title: String(form.get("title") || ""),
        description: String(
          form.get("description") || ""
        ),
        discountType: String(
          form.get("discountType") || ""
        ),
        discountValue: discountRaw
          ? Number(discountRaw)
          : null,
        regularPrice: regularRaw
          ? Number(regularRaw)
          : null,
        startsAt: startDate.toISOString()
      })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDealStatus(
        body.error || "Unable to schedule Valley Drop."
      );
    } else {
      setDealStatus(
        body.secretWord
          ? `Valley Drop scheduled. Secret word: ${body.secretWord}`
          : "Valley Drop scheduled."
      );

      event.currentTarget.reset();
      router.refresh();
    }

    setPendingDeal(false);
  }

  async function redeemClaim(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPendingRedeem(true);
    setRedeemStatus("");

    const form = new FormData(event.currentTarget);

    const code = String(
      form.get("claimCode") || ""
    )
      .trim()
      .toUpperCase();

    const response = await fetch("/api/merchant/redeem", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ code })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setRedeemStatus(
        body.error || "Unable to redeem that claim."
      );
    } else {
      setRedeemStatus(
        `Claim ${code} redeemed successfully.`
      );

      event.currentTarget.reset();
      router.refresh();
    }

    setPendingRedeem(false);
  }

  if (!approved.length) {
    return (
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <section className="rounded-xl border border-[#dedfd9] bg-white p-6">
          <div className="flex items-center gap-2">
            <Store
              size={20}
              className="text-[#173f30]"
            />

            <h2 className="text-xl font-semibold">
              Register your business
            </h2>
          </div>

          {pending.length ? (
            <div className="mt-5 rounded-lg border border-[#e0d7bf] bg-[#fbf7eb] p-5">
              <strong className="block">
                Application under review
              </strong>

              {pending.map(business => (
                <p
                  key={business.id}
                  className="mt-2 text-sm text-[#69675e]"
                >
                  {business.business_name} ·{" "}
                  {getTown(business.town_slug)?.name}
                </p>
              ))}

              <p className="mt-4 text-sm leading-6 text-[#69675e]">
                Roaring Fork Local will review the business before
                Valley Drops can be published.
              </p>
            </div>
          ) : (
            <form
              onSubmit={applyForMerchant}
              className="mt-5 grid gap-4"
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  Business name
                </span>

                <input
                  name="businessName"
                  required
                  className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  Business type
                </span>

                <select
                  name="businessType"
                  required
                  className="min-h-11 rounded-lg border border-[#d5d9d3] bg-white px-4"
                >
                  <option value="restaurant">
                    Restaurant
                  </option>
                  <option value="shop">
                    Shop / retail
                  </option>
                  <option value="service">
                    Local service
                  </option>
                  <option value="other">
                    Other business
                  </option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  Town
                </span>

                <select
                  name="townSlug"
                  required
                  className="min-h-11 rounded-lg border border-[#d5d9d3] bg-white px-4"
                >
                  {TOWNS.map(town => (
                    <option
                      key={town.slug}
                      value={town.slug}
                    >
                      {town.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  Business address
                </span>

                <input
                  name="address"
                  required
                  className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
                />
              </label>

              <button
                disabled={pendingApplication}
                className="mt-2 min-h-11 rounded-lg bg-[#173f30] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pendingApplication
                  ? "Submitting..."
                  : "Submit merchant application"}
              </button>

              {applicationStatus ? (
                <p className="text-sm text-[#596159]">
                  {applicationStatus}
                </p>
              ) : null}
            </form>
          )}
        </section>

        <aside className="rounded-xl border border-[#dedfd9] bg-[#faf7ef] p-6">
          <p className="eyebrow">
            Valley Drops
          </p>

          <h2 className="mt-3 font-serif text-3xl">
            25 deals. 60 minutes.
          </h2>

          <p className="mt-4 text-sm leading-6 text-[#626a64]">
            You choose the offer and the start time. Roaring Fork
            Local handles the countdown, secret word, claim codes
            and redemption.
          </p>
        </aside>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <form
          onSubmit={createDeal}
          className="rounded-xl border border-[#dedfd9] bg-white p-6"
        >
          <p className="eyebrow">
            Create a Valley Drop
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            Schedule a flash deal
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold">
                Business
              </span>

              <select
                name="businessId"
                required
                className="min-h-11 rounded-lg border border-[#d5d9d3] bg-white px-4"
              >
                {approved.map(business => (
                  <option
                    key={business.id}
                    value={business.id}
                  >
                    {business.business_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold">
                Deal title
              </span>

              <input
                name="title"
                required
                placeholder="50% off any burger"
                className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">
                Discount
              </span>

              <select
                name="discountType"
                required
                className="min-h-11 rounded-lg border border-[#d5d9d3] bg-white px-4"
              >
                <option value="percentage">
                  Percentage off
                </option>
                <option value="fixed_amount">
                  Dollar amount off
                </option>
                <option value="fixed_price">
                  Special price
                </option>
                <option value="bogo">
                  Buy one, get one
                </option>
                <option value="free_item">
                  Free item
                </option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">
                Discount value
              </span>

              <input
                name="discountValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="50"
                className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
              />

              <span className="text-xs text-[#727a74]">
                Example: 50 for 50% off, or 10 for $10 off.
                Leave blank for BOGO/free item.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">
                Regular price
              </span>

              <input
                name="regularPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="18.00"
                className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">
                Start date & time
              </span>

              <input
                name="startsAt"
                type="datetime-local"
                required
                className="min-h-11 rounded-lg border border-[#d5d9d3] px-4 py-3"
              />

              <span className="text-xs text-[#727a74]">
                Uses the time zone on the merchant’s device.
              </span>
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold">
                Description
              </span>

              <textarea
                name="description"
                rows={4}
                placeholder="Valid for dine-in. One per customer."
                className="rounded-lg border border-[#d5d9d3] px-4 py-3"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-lg bg-[#f6f4ed] p-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <TicketCheck size={15} />
              25 available
            </span>

            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Clock3 size={15} />
              60 minutes
            </span>

            <span className="inline-flex items-center gap-1.5 font-semibold">
              <KeyRound size={15} />
              Secret word generated automatically
            </span>
          </div>

          <button
            disabled={pendingDeal}
            className="mt-5 min-h-11 rounded-lg bg-[#173f30] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pendingDeal
              ? "Scheduling..."
              : "Schedule Valley Drop"}
          </button>

          {dealStatus ? (
            <p className="mt-4 text-sm font-medium text-[#536158]">
              {dealStatus}
            </p>
          ) : null}
        </form>

        <form
          onSubmit={redeemClaim}
          className="h-fit rounded-xl border border-[#dedfd9] bg-[#faf7ef] p-6"
        >
          <p className="eyebrow">
            At checkout
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            Redeem a claim
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#626a64]">
            Enter the customer’s six-character claim code.
          </p>

          <input
            name="claimCode"
            required
            maxLength={6}
            placeholder="A1B2C3"
            className="mt-5 min-h-12 w-full rounded-lg border border-[#d5d9d3] bg-white px-4 text-center text-xl font-bold uppercase tracking-[.18em]"
          />

          <button
            disabled={pendingRedeem}
            className="mt-3 min-h-11 w-full rounded-lg bg-[#173f30] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pendingRedeem
              ? "Redeeming..."
              : "Redeem deal"}
          </button>

          {redeemStatus ? (
            <p className="mt-4 text-sm font-medium text-[#536158]">
              {redeemStatus}
            </p>
          ) : null}
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">
          Your Valley Drops
        </h2>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#dedfd9] bg-white">
          {deals.length ? (
            deals.map(deal => (
              <article
                key={deal.id}
                className="grid gap-4 border-b border-[#e3e4de] p-5 last:border-0 lg:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>
                      {deal.title}
                    </strong>

                    <span className="rounded-full bg-[#eef1ec] px-2 py-1 text-[10px] font-bold uppercase tracking-[.06em]">
                      {deal.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#646d66]">
                    {discountLabel(deal)} · Starts{" "}
                    {mountainTime(deal.starts_at)} MT
                  </p>

                  <p className="mt-1 text-xs text-[#7b827d]">
                    {deal.claimCount} claimed ·{" "}
                    {deal.redeemedCount} redeemed ·{" "}
                    {Math.max(
                      0,
                      25 - deal.claimCount
                    )} remaining
                  </p>
                </div>

                <div className="rounded-lg bg-[#faf7ef] px-4 py-3">
                  <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#777f79]">
                    Secret word
                  </span>

                  <span className="mt-1 block text-lg font-bold tracking-[.08em] text-[#173f30]">
                    {deal.secretWord || "—"}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p className="p-6 text-sm text-[#69716b]">
              No Valley Drops scheduled yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
