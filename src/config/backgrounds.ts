import { getWeatherCategory as getWeatherCategoryFromCode } from "../services/weather";
import type { Location } from "../types";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type WeatherCategory = "clear" | "cloudy" | "rain" | "snow" | "storm";
type BackgroundLocation = Pick<
  Location,
  "name" | "latitude" | "longitude"
>;

const MAX_VARIANTS = 10;
const BASE_URL = "/backgrounds";
const DEFAULT_IMAGE = "/backgrounds/default.png";

const availableBackgrounds = import.meta.glob("/public/backgrounds/*.jpeg", {
  eager: true,
});
const availablePaths = new Set(
  Object.keys(availableBackgrounds).map((p) =>
    p.replace("/public/backgrounds/", ""),
  ),
);

function hasVariant(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  variant: number,
): boolean {
  return availablePaths.has(`${category}-${timeOfDay}-${variant}.jpeg`);
}

function getVariantCount(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
): number {
  for (let i = 1; i <= MAX_VARIANTS; i++) {
    if (!hasVariant(category, timeOfDay, i)) {
      return i - 1;
    }
  }
  return MAX_VARIANTS;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getLocationHash(location?: BackgroundLocation): number {
  if (!location) {
    return 0;
  }

  const locationKey = `${location.name}:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}`;
  let hash = 0;

  for (let i = 0; i < locationKey.length; i++) {
    hash = (hash * 31 + locationKey.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function getDayBasedVariant(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  variantCount: number,
  location?: BackgroundLocation,
): number {
  if (variantCount === 0) {
    return 0;
  }
  const dayOfYear = getDayOfYear();
  const locationHash = getLocationHash(location);
  const hash =
    (category.length * 31 + timeOfDay.length * 17 + dayOfYear + locationHash) %
    variantCount;
  return hash + 1;
}

export function getBackgroundImageUrl(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  location?: BackgroundLocation,
): string {
  const variantCount = getVariantCount(category, timeOfDay);
  if (variantCount === 0) {
    return DEFAULT_IMAGE;
  }
  const variant = getDayBasedVariant(
    category,
    timeOfDay,
    variantCount,
    location,
  );
  return `${BASE_URL}/${category}-${timeOfDay}-${variant}.jpeg`;
}

export const getWeatherCategory = (code: number): WeatherCategory => {
  return getWeatherCategoryFromCode(code);
};

export const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
};
