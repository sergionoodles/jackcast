import type { ClockFormat, UnitSystem } from "../config/preferences";

const MPH_PER_KMH = 0.621371;

export function convertTemperature(
  celsius: number,
  unitSystem: UnitSystem,
): number {
  return unitSystem === "us" ? (celsius * 9) / 5 + 32 : celsius;
}

export function getTemperatureUnit(unitSystem: UnitSystem): "°C" | "°F" {
  return unitSystem === "us" ? "°F" : "°C";
}

export function formatTemperature(
  celsius: number,
  unitSystem: UnitSystem,
): string {
  return `${Math.round(convertTemperature(celsius, unitSystem))}${getTemperatureUnit(unitSystem)}`;
}

export function formatWindSpeed(
  kilometersPerHour: number,
  unitSystem: UnitSystem,
): string {
  const value =
    unitSystem === "us"
      ? kilometersPerHour * MPH_PER_KMH
      : kilometersPerHour;
  return `${Math.round(value)} ${unitSystem === "us" ? "mph" : "km/h"}`;
}

export function formatClockTime(
  value: string,
  clockFormat: ClockFormat,
  includeMinutes = false,
): string | null {
  const match = value.match(/(?:T|^)(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: clockFormat === "24h" ? "2-digit" : "numeric",
    minute: includeMinutes ? "2-digit" : undefined,
    hourCycle: clockFormat === "24h" ? "h23" : "h12",
  }).format(new Date(2000, 0, 1, hour, minute));
}
