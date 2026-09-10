export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function hasCoordinates(value: Coordinates) {
  return (
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180 &&
    !(value.latitude === 0 && value.longitude === 0)
  );
}

export function distanceMiles(from: Coordinates, to: Coordinates) {
  const radians = Math.PI / 180;
  const latitudeDelta = (to.latitude - from.latitude) * radians;
  const longitudeDelta = (to.longitude - from.longitude) * radians;
  const fromLatitude = from.latitude * radians;
  const toLatitude = to.latitude * radians;

  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 3958.8 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function formatDistanceMiles(distance: number) {
  if (distance < 0.1) return "Less than 0.1 mi away";
  if (distance < 10) return `${distance.toFixed(1)} mi away`;

  return `${Math.round(distance)} mi away`;
}
