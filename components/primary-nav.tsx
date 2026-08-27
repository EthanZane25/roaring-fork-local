"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

export const PRIMARY_NAV = [
  ["Home", "/"],
  ["Eat", "/restaurants"],
  ["Marketplace", "/marketplace"],
  ["Vote", "/vote"],
  ["Events", "/events"],
  ["Jobs", "/jobs"],
  ["Housing", "/housing"]
] as const;

const TOWN_STORAGE_KEY = "rfl-town";
const TOWN_CHANGE_EVENT = "rfl-town-change";

function currentTown() {
  if (typeof window === "undefined") return "";
  const urlTown = new URL(window.location.href).searchParams.get("town") || "";
  return urlTown || window.localStorage.getItem(TOWN_STORAGE_KEY) || "";
}

function subscribeTown(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("popstate", callback);
  window.addEventListener(TOWN_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener(TOWN_CHANGE_EVENT, callback);
  };
}

export function PrimaryNav({ town, className = "" }: { town?: string; className?: string }) {
  const rememberedTown = useSyncExternalStore(subscribeTown, currentTown, () => "");
  const activeTown = town || rememberedTown;

  return (
    <nav className={`overflow-x-auto ${className}`} aria-label="Primary navigation">
      <div className="flex min-w-max items-center gap-7">
        {PRIMARY_NAV.map(([label, href]) => {
          const destination = activeTown ? `${href}${href.includes("?") ? "&" : "?"}town=${encodeURIComponent(activeTown)}` : href;
          return (
            <Link
              key={href}
              href={destination}
              className="whitespace-nowrap py-3 text-[14px] font-medium text-[#3f4540] transition-colors hover:text-[#173f30]"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
