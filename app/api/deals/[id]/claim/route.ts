import {
  NextResponse
} from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  {
    params
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to claim this Valley Drop." },
      { status: 401 }
    );
  }

  const { data, error } =
    await supabase.rpc(
      "claim_valley_drop",
      {
        p_deal_id: id
      }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  const claim = Array.isArray(data)
    ? data[0]
    : data;

  return NextResponse.json({
    ok: true,
    claim
  });
}
