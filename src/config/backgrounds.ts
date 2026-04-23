import { getWeatherCategory as getWeatherCategoryFromCode } from "../services/weather";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type WeatherCategory = "clear" | "cloudy" | "rain" | "snow" | "storm";

export interface BackgroundAsset {
  imageUrl: string;
}

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

function getDayBasedVariant(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  variantCount: number,
): number {
  if (variantCount === 0) {
    return 0;
  }
  const dayOfYear = getDayOfYear();
  const hash =
    (category.length * 31 + timeOfDay.length * 17 + dayOfYear) % variantCount;
  return hash + 1;
}

function buildImageUrl(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
): string {
  const variantCount = getVariantCount(category, timeOfDay);
  if (variantCount === 0) {
    return DEFAULT_IMAGE;
  }
  const variant = getDayBasedVariant(category, timeOfDay, variantCount);
  return `${BASE_URL}/${category}-${timeOfDay}-${variant}.jpeg`;
}

// Basic structure for background assets.
// We use placeholder images with specific seeds to simulate different weather and times.
// These can easily be replaced with local asset paths (e.g., '/assets/bg/clear-morning.jpeg') later.
export const backgroundAssets: Record<
  WeatherCategory,
  Record<TimeOfDay, BackgroundAsset>
> = {
  clear: {
    morning: { imageUrl: buildImageUrl("clear", "morning") },
    afternoon: { imageUrl: buildImageUrl("clear", "afternoon") },
    evening: { imageUrl: buildImageUrl("clear", "evening") },
    night: { imageUrl: buildImageUrl("clear", "night") },
  },
  cloudy: {
    morning: { imageUrl: buildImageUrl("cloudy", "morning") },
    afternoon: { imageUrl: buildImageUrl("cloudy", "afternoon") },
    evening: { imageUrl: buildImageUrl("cloudy", "evening") },
    night: { imageUrl: buildImageUrl("cloudy", "night") },
  },
  rain: {
    morning: { imageUrl: buildImageUrl("rain", "morning") },
    afternoon: { imageUrl: buildImageUrl("rain", "afternoon") },
    evening: { imageUrl: buildImageUrl("rain", "evening") },
    night: { imageUrl: buildImageUrl("rain", "night") },
  },
  snow: {
    morning: { imageUrl: buildImageUrl("snow", "morning") },
    afternoon: { imageUrl: buildImageUrl("snow", "afternoon") },
    evening: { imageUrl: buildImageUrl("snow", "evening") },
    night: { imageUrl: buildImageUrl("snow", "night") },
  },
  storm: {
    morning: { imageUrl: buildImageUrl("storm", "morning") },
    afternoon: { imageUrl: buildImageUrl("storm", "afternoon") },
    evening: { imageUrl: buildImageUrl("storm", "evening") },
    night: { imageUrl: buildImageUrl("storm", "night") },
  },
};

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
