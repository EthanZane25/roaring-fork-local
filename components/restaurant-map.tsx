"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";

import type { Restaurant } from "@/lib/types";
import {
  distanceMiles,
  formatDistanceMiles,
  hasCoordinates,
  type Coordinates
} from "@/lib/geo";
import { cuisineLabel, getTown } from "@/lib/constants";

type RestaurantMapProps = {
  restaurants: Restaurant[];
  userLocation: Coordinates | null;
};

const VALLEY_CENTER: [number, number] = [39.389, -107.303];
const VALLEY_ZOOM = 9;

function FitToResults({
  restaurants,
  userLocation
}: RestaurantMapProps) {
  const map = useMap();

  const points = useMemo(
    () => [
      ...restaurants.filter(hasCoordinates),
      ...(userLocation ? [userLocation] : [])
    ],
    [restaurants, userLocation]
  );

  useEffect(() => {
    if (!points.length) {
      map.setView(VALLEY_CENTER, VALLEY_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView(
        [points[0].latitude, points[0].longitude],
        14
      );
      return;
    }

    map.fitBounds(
      points.map(point => [point.latitude, point.longitude]),
      {
        padding: [36, 36],
        maxZoom: 13
      }
    );
  }, [map, points]);

  return null;
}

export function RestaurantMap({
  restaurants,
  userLocation
}: RestaurantMapProps) {
  const mappedRestaurants = restaurants.filter(hasCoordinates);

  return (
    <div className="restaurant-map h-full min-h-[520px]">
      <MapContainer
        center={VALLEY_CENTER}
        zoom={VALLEY_ZOOM}
        scrollWheelZoom={false}
        className="h-full min-h-[520px] w-full"
        aria-label="Map of matching restaurants in the Roaring Fork Valley"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToResults
          restaurants={mappedRestaurants}
          userLocation={userLocation}
        />

        {userLocation ? (
          <>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={300}
              pathOptions={{
                color: "#1d5f8c",
                fillColor: "#5ea3cb",
                fillOpacity: 0.16,
                weight: 1
              }}
            />
            <CircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#1d5f8c",
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>Your approximate location</Popup>
            </CircleMarker>
          </>
        ) : null}

        {mappedRestaurants.map(restaurant => {
          const distance = userLocation
            ? distanceMiles(userLocation, restaurant)
            : null;

          return (
            <CircleMarker
              key={restaurant.id}
              center={[restaurant.latitude, restaurant.longitude]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#173f30",
                fillOpacity: 1,
                weight: 2
              }}
            >
              <Popup>
                <div className="min-w-[170px] py-0.5">
                  <Link
                    href={`/restaurants/${restaurant.slug}`}
                    className="text-sm font-semibold text-[#173f30] hover:underline"
                  >
                    {restaurant.name}
                  </Link>
                  <p className="mt-1 text-xs text-[#59625b]">
                    {getTown(restaurant.town)?.name} · {cuisineLabel(restaurant.cuisine)}
                  </p>
                  {distance !== null ? (
                    <p className="mt-1 text-xs font-semibold text-[#315e49]">
                      {formatDistanceMiles(distance)}
                    </p>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
