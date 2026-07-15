import { getWeatherCategory as getWeatherCategoryFromCode } from "../services/weather";
import type { Location } from "../types";
import { availableVariantsBySet } from "./background-assets";
import { getTheme, type ThemeId } from "./themes";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type WeatherCategory = "clear" | "cloudy" | "rain" | "snow" | "storm";
type BackgroundLocation = Pick<
  Location,
  "name" | "latitude" | "longitude"
>;
function getAvailableVariants(
  backgroundSet: string,
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
): number[] {
  const backgroundKey = `${category}-${timeOfDay}`;
  return availableVariantsBySet[backgroundSet]?.[backgroundKey] ?? [];
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
  availableVariants: number[],
  location?: BackgroundLocation,
): number {
  if (availableVariants.length === 0) {
    return 0;
  }
  const dayOfYear = getDayOfYear();
  const locationHash = getLocationHash(location);
  const variantCount = availableVariants.length;
  const hash =
    (category.length * 31 + timeOfDay.length * 17 + dayOfYear + locationHash) %
    variantCount;
  return availableVariants[hash];
}

export function getBackgroundImageUrl(
  themeId: ThemeId,
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  location?: BackgroundLocation,
): string {
  const theme = getTheme(themeId);
  const availableVariants = getAvailableVariants(
    theme.backgroundSet,
    category,
    timeOfDay,
  );
  if (availableVariants.length === 0) {
    return theme.fallbackBackground;
  }
  const variant = getDayBasedVariant(
    category,
    timeOfDay,
    availableVariants,
    location,
  );
  return `/backgrounds/${theme.backgroundSet}/${category}-${timeOfDay}-${variant}.jpeg`;
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
