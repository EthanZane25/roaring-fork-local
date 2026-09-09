import {
  NextRequest,
  NextResponse
} from "next/server";

import { createClient } from "@/lib/supabase/server";

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
    code?: string;
  } | null;

  const code =
    body?.code?.trim().toUpperCase() || "";

  if (code.length !== 6) {
    return NextResponse.json(
      {
        error:
          "Enter the six-character customer claim code."
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc(
    "redeem_valley_drop_claim",
    {
      p_claim_code: code
    }
  );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true
  });
}
