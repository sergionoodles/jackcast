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

interface HourlyForecastProps {
  hourly: HourlyForecastType;
  currentTime: string;
}

const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code <= 1)
    return isDay ? (
      <Sun className="w-6 h-6 text-yellow-400" />
    ) : (
      <Moon className="w-6 h-6 text-blue-200" />
    );
  if (code === 2) return <Cloud className="w-6 h-6 text-gray-300" />;
  if (code === 3 || code === 45 || code === 48)
    return <CloudFog className="w-6 h-6 text-gray-400" />;
  if (code >= 51 && code <= 57)
    return <CloudDrizzle className="w-6 h-6 text-blue-300" />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className="w-6 h-6 text-blue-400" />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <CloudSnow className="w-6 h-6 text-white" />;
  if (code >= 95) return <CloudLightning className="w-6 h-6 text-yellow-300" />;
  return <Sun className="w-6 h-6 text-yellow-400" />;
};

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  return date.toLocaleTimeString([], { hour: "numeric" });
};

const HourlyForecast: React.FC<HourlyForecastProps> = ({
  hourly,
  currentTime,
}) => {
  // Find the index of the current hour
  const now = new Date(currentTime);
  const currentHourIndex = hourly.time.findIndex((t) => new Date(t) > now);
  const startIndex = currentHourIndex > 0 ? currentHourIndex - 1 : 0;
  const next24Hours = hourly.time.slice(startIndex, startIndex + 24);
  const next24Temps = hourly.temperature.slice(startIndex, startIndex + 24);
  const next24Codes = hourly.weatherCode.slice(startIndex, startIndex + 24);
  const next24Wind = hourly.windSpeed.slice(startIndex, startIndex + 24);
  const next24Humidity = hourly.humidity.slice(startIndex, startIndex + 24);
  const next24Rain = hourly.precipitationProbability.slice(
    startIndex,
    startIndex + 24,
  );
  const avg = (values: number[]) =>
    values.length === 0
      ? 0
      : Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        );
  const averageWind = avg(next24Wind);
  const averageHumidity = avg(next24Humidity);
  const averageRain = avg(next24Rain);

  return (
    <motion.div
      className="w-full px-3 mb-3 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="bg-mist-900/40 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-white/90 text-sm font-medium uppercase tracking-wider">
            Today
          </h3>
          <div className="flex flex-wrap justify-end gap-1.5 text-[11px] font-medium text-white/85">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
              <Wind className="h-3.5 w-3.5" />
              {averageWind} km/h
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
              <Droplets className="h-3.5 w-3.5" />
              {averageHumidity}%
            </span>
            {averageRain > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                <CloudRain className="h-3.5 w-3.5 text-blue-300" />
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
                <span className="text-white font-medium text-sm">
                  {index === 0 ? "Now" : formatTime(time)}
                </span>
                {getWeatherIcon(code, isDay)}
                <span className="text-white font-semibold text-lg">
                  {Math.round(temperature)}°
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
