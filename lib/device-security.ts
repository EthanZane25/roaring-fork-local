import type { NextRequest } from "next/server";

export const DEVICE_COOKIE_NAME = "rfl_device";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getDeviceToken(request: NextRequest) {
  return request.cookies.get(DEVICE_COOKIE_NAME)?.value || null;
}
