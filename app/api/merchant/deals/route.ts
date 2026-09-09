import {
  NextRequest,
  NextResponse
} from "next/server";

import { createClient } from "@/lib/supabase/server";

const DISCOUNT_TYPES = new Set([
  "percentage",
  "fixed_amount",
  "fixed_price",
  "bogo",
  "free_item"
]);

export async function POST(
  request: NextRequest
) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Merchant sign in is required." },
      { status: 401 }
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as {
    businessId?: string;
    title?: string;
    description?: string;
    discountType?: string;
    discountValue?: number | null;
    regularPrice?: number | null;
    startsAt?: string;
  } | null;

  const businessId =
    body?.businessId?.trim() || "";

  const title =
    body?.title?.trim() || "";

  const description =
    body?.description?.trim() || "";

  const discountType =
    body?.discountType?.trim() || "";

  const discountValue =
    body?.discountValue == null
      ? null
      : Number(body.discountValue);

  const regularPrice =
    body?.regularPrice == null
      ? null
      : Number(body.regularPrice);

  const startMs = Date.parse(
    body?.startsAt || ""
  );

  if (
    !businessId ||
    title.length < 3 ||
    !DISCOUNT_TYPES.has(discountType) ||
    !Number.isFinite(startMs)
  ) {
    return NextResponse.json(
      {
        error:
          "Business, deal title, discount and start time are required."
      },
      { status: 400 }
    );
  }

  if (
    startMs <
    Date.now() - 5 * 60 * 1000
  ) {
    return NextResponse.json(
      {
        error:
          "The Valley Drop start time cannot be in the past."
      },
      { status: 400 }
    );
  }

  if (
    discountType === "percentage" &&
    (
      discountValue == null ||
      discountValue <= 0 ||
      discountValue > 100
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Percentage discounts must be between 1 and 100."
      },
      { status: 400 }
    );
  }

  if (
    ["fixed_amount", "fixed_price"].includes(
      discountType
    ) &&
    (
      discountValue == null ||
      discountValue <= 0
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a valid dollar amount for this deal."
      },
      { status: 400 }
    );
  }

  const { data: business } = await supabase
    .from("merchant_businesses")
    .select("id,status")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (
    !business ||
    business.status !== "approved"
  ) {
    return NextResponse.json(
      {
        error:
          "This business is not approved for Valley Drops."
      },
      { status: 403 }
    );
  }

  const startsAt =
    new Date(startMs).toISOString();

  const endsAt = new Date(
    startMs + 60 * 60 * 1000
  ).toISOString();

  const status =
    startMs <= Date.now() + 60 * 1000
      ? "live"
      : "scheduled";

  const { data: deal, error } =
    await supabase
      .from("deal_drops")
      .insert({
        business_id: businessId,
        title,
        description,
        discount_type: discountType,
        discount_value:
          discountType === "bogo" ||
          discountType === "free_item"
            ? null
            : discountValue,
        regular_price:
          regularPrice != null &&
          Number.isFinite(regularPrice)
            ? regularPrice
            : null,
        quantity_total: 25,
        duration_minutes: 60,
        starts_at: startsAt,
        ends_at: endsAt,
        redemption_ends_at: endsAt,
        one_per_user: true,
        status,
        created_by: user.id
      })
      .select("id")
      .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  const { data: secret } = await supabase
    .from("deal_drop_secrets")
    .select("secret_word")
    .eq("deal_id", deal.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    id: deal.id,
    secretWord:
      secret?.secret_word || null
  });
}
