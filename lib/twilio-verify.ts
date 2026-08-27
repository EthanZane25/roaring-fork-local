function credentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

export function hasTwilioVerify() {
  return Boolean(credentials());
}

function authHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export async function startPhoneVerification(phone: string) {
  const config = credentials();
  if (!config) return { ok: false, error: "SMS verification is not configured." };
  const form = new URLSearchParams({ To: phone, Channel: "sms" });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${config.serviceSid}/Verifications`, {
    method: "POST",
    headers: {
      authorization: authHeader(config.accountSid, config.authToken),
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form.toString(),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({})) as { status?: string; message?: string };
  return response.ok ? { ok: true, status: data.status } : { ok: false, error: data.message || "Unable to send verification code." };
}

export async function checkPhoneVerification(phone: string, code: string) {
  const config = credentials();
  if (!config) return { ok: false, error: "SMS verification is not configured." };
  const form = new URLSearchParams({ To: phone, Code: code });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${config.serviceSid}/VerificationCheck`, {
    method: "POST",
    headers: {
      authorization: authHeader(config.accountSid, config.authToken),
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form.toString(),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({})) as { status?: string; valid?: boolean; message?: string };
  if (!response.ok) return { ok: false, error: data.message || "Unable to verify code." };
  return { ok: data.status === "approved" && data.valid !== false, status: data.status };
}
