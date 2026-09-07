"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export const PRIMARY_NAV = [
  ["Home", "/"],
  ["Eat", "/restaurants"],
  ["Marketplace", "/marketplace"],
  ["Events", "/events"],
  ["Jobs", "/jobs"],
  ["Housing", "/housing"],
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
    <nav
      className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      aria-label="Primary navigation"
    >
      <div className="flex min-w-max items-center gap-2 lg:gap-3">
        {PRIMARY_NAV.map(([label, href]) => {
          const destination = activeTown
            ? `${href}${href.includes("?") ? "&" : "?"}town=${encodeURIComponent(activeTown)}`
            : href;
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={destination}
              className={`relative whitespace-nowrap px-2.5 py-5 text-[14px] font-medium transition-colors ${
                active ? "text-[#202a24]" : "text-[#303730] hover:text-[#173f30]"
              }`}
            >
              {label}
              {active ? <span className="absolute inset-x-2.5 bottom-3 h-[2px] bg-[#b38a28]" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
