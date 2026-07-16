export type UnitSystem = "metric" | "us";
export type ClockFormat = "12h" | "24h";

export const DEFAULT_UNIT_SYSTEM: UnitSystem = "metric";
export const UNIT_SYSTEM_STORAGE_KEY = "jackcastUnitSystem";
export const CLOCK_FORMAT_STORAGE_KEY = "jackcastClockFormat";

export function isUnitSystem(value: string | null): value is UnitSystem {
  return value === "metric" || value === "us";
}

export function isClockFormat(value: string | null): value is ClockFormat {
  return value === "12h" || value === "24h";
}

export function getDefaultClockFormat(): ClockFormat {
  const options = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
  }).resolvedOptions();

  return options.hour12 === true ||
    options.hourCycle === "h11" ||
    options.hourCycle === "h12"
    ? "12h"
    : "24h";
}
