import { TOWNS } from "@/lib/constants";
import { distanceMiles, type Coordinates } from "@/lib/geo";
import type { Town } from "@/lib/types";

export const TOWN_STORAGE_KEY = "rfl-town";
export const TOWN_COOKIE = "rfl_town";
export const TOWN_CHANGE_EVENT = "rfl-town-change";

export function closestTownFromCoordinates(coords: Coordinates): Town {
  let closest = TOWNS[0];
  let closestDistance = Infinity;

  for (const town of TOWNS) {
    const distance = distanceMiles(coords, town);

    if (distance < closestDistance) {
      closest = town;
      closestDistance = distance;
    }
  }

  return closest;
}

export function rememberTown(town: string) {
  if (typeof window === "undefined") return;

  if (town) {
    window.localStorage.setItem(TOWN_STORAGE_KEY, town);
    document.cookie = `${TOWN_COOKIE}=${encodeURIComponent(town)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } else {
    window.localStorage.removeItem(TOWN_STORAGE_KEY);
    document.cookie = `${TOWN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }

  window.dispatchEvent(new Event(TOWN_CHANGE_EVENT));
}
