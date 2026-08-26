export async function verifyTurnstile(token: string | null | undefined, expectedAction?: string) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false };

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token })
  });

  const result = await response.json() as {
    success?: boolean;
    action?: string;
    hostname?: string;
  };

  const expectedHostname = process.env.TURNSTILE_HOSTNAME;
  const actionMatches = !expectedAction || result.action === expectedAction;
  const hostnameMatches = !expectedHostname || result.hostname === expectedHostname;

  return {
    ok: result.success === true && actionMatches && hostnameMatches,
    skipped: false
  };
}
