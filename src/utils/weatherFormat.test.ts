import { describe, expect, it } from "vitest";
import {
  getDefaultClockFormat,
  isClockFormat,
  isUnitSystem,
} from "../config/preferences";
import {
  convertTemperature,
  formatClockTime,
  formatTemperature,
  formatWindSpeed,
} from "./weatherFormat";

describe("weather measurement formatting", () => {
  it("converts Celsius temperatures to Fahrenheit", () => {
    expect(convertTemperature(0, "us")).toBe(32);
    expect(convertTemperature(100, "us")).toBe(212);
    expect(formatTemperature(1, "us")).toBe("34°F");
  });

  it("preserves metric temperatures", () => {
    expect(formatTemperature(18.6, "metric")).toBe("19°C");
  });

  it("converts wind speed before rounding", () => {
    expect(formatWindSpeed(2.49, "us")).toBe("2 mph");
    expect(formatWindSpeed(10, "metric")).toBe("10 km/h");
  });
});

describe("clock formatting", () => {
  it("formats midnight and afternoon in a 12-hour clock", () => {
    expect(formatClockTime("2026-07-16T00:00", "12h", true)).toBe(
      "12:00 AM",
    );
    expect(formatClockTime("2026-07-16T13:05", "12h", true)).toBe(
      "1:05 PM",
    );
    expect(formatClockTime("2026-07-16T13:05", "12h")).toBe("1 PM");
  });

  it("formats midnight and afternoon in a 24-hour clock", () => {
    expect(formatClockTime("2026-07-16T00:00", "24h", true)).toBe("00:00");
    expect(formatClockTime("2026-07-16T13:05", "24h", true)).toBe("13:05");
    expect(formatClockTime("2026-07-16T13:05", "24h")).toBe("13");
  });

  it("rejects invalid provider times", () => {
    expect(formatClockTime("not-a-time", "24h")).toBeNull();
    expect(formatClockTime("2026-07-16T25:00", "24h")).toBeNull();
  });
});

describe("preference validation", () => {
  it("accepts only supported preference values", () => {
    expect(isUnitSystem("metric")).toBe(true);
    expect(isUnitSystem("imperial")).toBe(false);
    expect(isClockFormat("12h")).toBe(true);
    expect(isClockFormat("system")).toBe(false);
    expect(["12h", "24h"]).toContain(getDefaultClockFormat());
  });
});
