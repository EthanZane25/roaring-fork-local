import {
  NextRequest,
  NextResponse
} from "next/server";

import { TOWNS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const BUSINESS_TYPES = new Set([
  "restaurant",
  "shop",
  "service",
  "other"
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
      { error: "Sign in is required." },
      { status: 401 }
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as {
    businessName?: string;
    businessType?: string;
    townSlug?: string;
    address?: string;
  } | null;

  const businessName =
    body?.businessName?.trim() || "";

  const businessType =
    body?.businessType?.trim() || "";

  const townSlug =
    body?.townSlug?.trim() || "";

  const address =
    body?.address?.trim() || "";

  if (
    businessName.length < 2 ||
    !BUSINESS_TYPES.has(businessType) ||
    !TOWNS.some(town => town.slug === townSlug) ||
    !address
  ) {
    return NextResponse.json(
      {
        error:
          "Business name, type, town and address are required."
      },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("merchant_businesses")
    .select("id,status")
    .eq("owner_id", user.id)
    .eq("business_name", businessName)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          "This business already has a merchant application."
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("merchant_businesses")
    .insert({
      owner_id: user.id,
      business_name: businessName,
      business_type: businessType,
      town_slug: townSlug,
      address,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: data.id
  });
}
