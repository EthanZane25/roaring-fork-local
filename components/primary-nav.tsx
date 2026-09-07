"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export const PRIMARY_NAV = [
  ["Eat", "/restaurants"],
  ["Marketplace", "/marketplace"],
  ["Events", "/events"],
  ["Vote", "/vote"]
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
  const pathname = usePathname();
  const rememberedTown = useSyncExternalStore(subscribeTown, currentTown, () => "");
  const activeTown = town || rememberedTown;

  return (
    <nav className={className} aria-label="Primary navigation">
      <div className="flex items-center gap-0 sm:gap-2">
        {PRIMARY_NAV.map(([label, href]) => {
          const destination = activeTown
            ? `${href}?town=${encodeURIComponent(activeTown)}`
            : href;
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={destination}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 items-center whitespace-nowrap px-2 text-[12px] font-semibold transition-colors sm:px-3 sm:text-[14px] ${
                active ? "text-[#173f30]" : "text-[#3d4740] hover:text-[#173f30]"
              }`}
            >
              {label}
              {active ? <span className="absolute inset-x-2 bottom-0 sm:inset-x-3 h-[2px] bg-[#b38a28]" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
