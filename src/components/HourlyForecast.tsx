import React from "react";
import { motion } from "motion/react";
import { HourlyForecast as HourlyForecastType } from "../types";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
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

  return (
    <motion.div
      className="w-full px-4 mb-6 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="bg-mist-900/40 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/10">
        <h3 className="text-white/90 text-sm font-medium mb-4 uppercase tracking-wider">
          Today
        </h3>
        <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-6">
          {next24Hours.map((time, index) => {
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
                {getWeatherIcon(next24Codes[index], isDay)}
                <span className="text-white font-semibold text-lg">
                  {Math.round(next24Temps[index])}°
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
