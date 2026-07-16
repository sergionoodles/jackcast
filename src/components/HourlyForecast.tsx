import React from "react";
import { motion } from "motion/react";
import { HourlyForecast as HourlyForecastType } from "../types";
import {
  CloudRain,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Droplets,
  Moon,
  Sun,
  Wind,
} from "lucide-react";
import type { ClockFormat, UnitSystem } from "../config/preferences";
import {
  formatClockTime,
  formatTemperature,
  formatWindSpeed,
} from "../utils/weatherFormat";

interface HourlyForecastProps {
  hourly: HourlyForecastType;
  currentTime: string;
  unitSystem: UnitSystem;
  clockFormat: ClockFormat;
}

const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code <= 1)
    return isDay ? (
      <Sun className="forecast-weather-icon w-6 h-6 text-yellow-400" />
    ) : (
      <Moon className="forecast-weather-icon w-6 h-6 text-blue-200" />
    );
  if (code === 2)
    return <Cloud className="forecast-weather-icon w-6 h-6 text-gray-300" />;
  if (code === 3 || code === 45 || code === 48)
    return <CloudFog className="forecast-weather-icon w-6 h-6 text-gray-400" />;
  if (code >= 51 && code <= 57)
    return <CloudDrizzle className="forecast-weather-icon w-6 h-6 text-blue-300" />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className="forecast-weather-icon w-6 h-6 text-blue-400" />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <CloudSnow className="forecast-weather-icon w-6 h-6 text-white" />;
  if (code >= 95)
    return (
      <CloudLightning className="forecast-weather-icon w-6 h-6 text-yellow-300" />
    );
  return <Sun className="forecast-weather-icon w-6 h-6 text-yellow-400" />;
};

const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hourly,
  currentTime,
  unitSystem,
  clockFormat,
}) => {
  const now = new Date(currentTime);
  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);
  const currentHourIndex = hourly.time.findIndex(
    (t) => new Date(t) >= currentHourStart,
  );
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  const next24Hours = hourly.time.slice(startIndex, startIndex + 24);
  const next24Temps = hourly.temperature.slice(startIndex, startIndex + 24);
  const next24Codes = hourly.weatherCode.slice(startIndex, startIndex + 24);
  const next24Wind = hourly.windSpeed.slice(startIndex, startIndex + 24);
  const next24Humidity = hourly.humidity.slice(startIndex, startIndex + 24);
  const next24Rain = hourly.precipitationProbability.slice(
    startIndex,
    startIndex + 24,
  );
  const average = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;
  const averageWind = average(next24Wind);
  const averageHumidity = Math.round(average(next24Humidity));
  const averageRain = Math.round(average(next24Rain));

  return (
    <motion.div
      className="w-full px-3 mb-3 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="forecast-glass p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="forecast-muted text-sm font-medium uppercase tracking-wider">
            Today
          </h3>
          <div className="flex flex-wrap justify-end gap-1.5 text-[11px] font-medium">
            <span className="forecast-badge inline-flex items-center gap-1 px-2 py-0.5">
              <Wind className="h-3.5 w-3.5" />
              {formatWindSpeed(averageWind, unitSystem)}
            </span>
            <span className="forecast-badge inline-flex items-center gap-1 px-2 py-0.5">
              <Droplets className="h-3.5 w-3.5" />
              {averageHumidity}%
            </span>
            {averageRain > 0 && (
              <span className="forecast-badge inline-flex items-center gap-1 px-2 py-0.5">
                <CloudRain className="forecast-weather-icon h-3.5 w-3.5 text-blue-300" />
                {averageRain}%
              </span>
            )}
          </div>
        </div>
        <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-6">
          {next24Hours.map((time, index) => {
            const code = next24Codes[index];
            const temperature = next24Temps[index];
            if (code === undefined || temperature === undefined) {
              return null;
            }

            const date = new Date(time);
            const isDay = date.getHours() >= 6 && date.getHours() < 18; // Simple approximation
            return (
              <div
                key={time}
                className="flex flex-col items-center flex-shrink-0 space-y-3"
              >
                <span className="forecast-panel-text font-medium text-sm">
                  {index === 0
                    ? "Now"
                    : (formatClockTime(time, clockFormat) ?? "")}
                </span>
                {getWeatherIcon(code, isDay)}
                <span className="forecast-panel-text font-semibold text-lg">
                  {formatTemperature(temperature, unitSystem)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default HourlyForecast;
