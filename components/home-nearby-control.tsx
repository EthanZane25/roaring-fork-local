"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SiteTownControl } from "@/components/site-town-control";
import { getTown } from "@/lib/constants";
import {
  closestTownFromCoordinates,
  rememberTown
} from "@/lib/town-location";

export function HomeNearbyControl({ town = "" }: { town?: string }) {
  const router = useRouter();
  const [isFinding, setIsFinding] = useState(false);
  const [message, setMessage] = useState("");
  const [showTownPicker, setShowTownPicker] = useState(false);
  const activeTown = getTown(town);

  function navigate(nextTown: string) {
    rememberTown(nextTown);
    setMessage("");
    setShowTownPicker(false);
    router.push(nextTown ? `/?town=${encodeURIComponent(nextTown)}` : "/");
  }

  function findNearby() {
    if (!navigator.geolocation) {
      setMessage("This browser cannot use location. Choose a town instead.");
      setShowTownPicker(true);
      return;
    }

    setIsFinding(true);
    setMessage("Finding nearby places…");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsFinding(false);
        navigate(
          closestTownFromCoordinates({
            latitude: coords.latitude,
            longitude: coords.longitude
          }).slug
        );
      },
      () => {
        setIsFinding(false);
        setMessage("We could not use your location. Choose a town instead.");
        setShowTownPicker(true);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={findNearby}
          disabled={isFinding}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white bg-white px-4 text-sm font-semibold text-[#173f30] shadow-[0_2px_9px_rgba(0,0,0,.14)] transition hover:bg-[#f4f6f2] disabled:cursor-wait disabled:opacity-80"
        >
          <LocateFixed size={17} strokeWidth={1.9} aria-hidden="true" />
          {isFinding ? "Finding nearby…" : activeTown ? "Update my location" : "Find what’s near me"}
        </button>

        {activeTown ? (
          <div className="flex items-center gap-2 text-sm text-white">
            <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>
              Showing places near <strong>{activeTown.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => navigate("")}
              className="underline decoration-white/60 underline-offset-4 transition hover:decoration-white"
            >
              View the valley
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/90">
            Uses your location only to choose a nearby town.
          </p>
        )}
      </div>

      {message ? (
        <p role="status" className="mt-3 text-sm text-white">
          {message}
        </p>
      ) : null}

      {showTownPicker ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/90">Choose a town instead:</span>
          <SiteTownControl compact />
        </div>
      ) : null}
    </div>
  );
}
