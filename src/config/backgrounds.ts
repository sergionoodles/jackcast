import { getWeatherCategory as getWeatherCategoryFromCode } from "../services/weather";
import type { Location } from "../types";
import { getTheme, type ThemeId } from "./themes";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type WeatherCategory = "clear" | "cloudy" | "rain" | "snow" | "storm";
type BackgroundLocation = Pick<
  Location,
  "name" | "latitude" | "longitude"
>;

const backgroundAssets = import.meta.glob(
  "../assets/themes/*/covers/*.{jpeg,jpg,png,webp}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

type BackgroundAsset = {
  set: string;
  category: WeatherCategory;
  timeOfDay: TimeOfDay;
  variant: number;
  url: string;
};

const backgroundAssetsBySet = Object.entries(backgroundAssets).reduce<
  Record<string, BackgroundAsset[]>
>((assetsBySet, [path, url]) => {
  const match = path.match(
    /\/themes\/([^/]+)\/covers\/(clear|cloudy|rain|snow|storm)-(morning|afternoon|evening|night)-(\d+)\.(?:jpeg|jpg|png|webp)$/,
  );
  if (!match) {
    return assetsBySet;
  }

  const [, set, category, timeOfDay, variant] = match;
  const asset = {
    set,
    category: category as WeatherCategory,
    timeOfDay: timeOfDay as TimeOfDay,
    variant: Number(variant),
    url,
  };
  (assetsBySet[set] ??= []).push(asset);
  return assetsBySet;
}, {});

for (const assets of Object.values(backgroundAssetsBySet)) {
  assets.sort((first, second) => first.variant - second.variant);
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

function getDayBasedAsset(
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  availableAssets: BackgroundAsset[],
  location?: BackgroundLocation,
): BackgroundAsset | undefined {
  if (availableAssets.length === 0) {
    return undefined;
  }
  const dayOfYear = getDayOfYear();
  const locationHash = getLocationHash(location);
  const variantCount = availableAssets.length;
  const hash =
    (category.length * 31 + timeOfDay.length * 17 + dayOfYear + locationHash) %
    variantCount;
  return availableAssets[hash];
}

export function getBackgroundImageUrl(
  themeId: ThemeId,
  category: WeatherCategory,
  timeOfDay: TimeOfDay,
  location?: BackgroundLocation,
): string | undefined {
  const theme = getTheme(themeId);
  const assets = backgroundAssetsBySet[theme.backgroundSet] ?? [];
  const matchingAssets = assets.filter(
    (asset) => asset.category === category && asset.timeOfDay === timeOfDay,
  );
  const selectedAsset = getDayBasedAsset(
    category,
    timeOfDay,
    matchingAssets.length > 0 ? matchingAssets : assets,
    location,
  );
  return selectedAsset?.url;
}

export function getThemePreviewImageUrl(themeId: ThemeId): string | undefined {
  return backgroundAssetsBySet[getTheme(themeId).backgroundSet]?.[0]?.url;
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
