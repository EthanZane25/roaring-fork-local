import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Voting persistence requires Supabase." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as {
    pollId?: string;
    optionId?: string;
    turnstileToken?: string;
  } | null;

  if (!body?.pollId || !body.optionId) {
    return NextResponse.json({ error: "Missing poll or option." }, { status: 400 });
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, "vote");
  if (!turnstile.ok) {
    return NextResponse.json({ error: "Security verification failed." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const { error } = await supabase.from("votes").insert({
    poll_id: body.pollId,
    option_id: body.optionId,
    user_id: user.id
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already voted in this poll." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to record vote." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
