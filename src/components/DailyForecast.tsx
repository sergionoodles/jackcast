import React from "react";
import { motion } from "motion/react";
import { DailyForecast as DailyForecastType } from "../types";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from "lucide-react";

interface DailyForecastProps {
  daily: DailyForecastType;
}

const getWeatherIcon = (code: number) => {
  if (code <= 1) return <Sun className="w-6 h-6 text-yellow-400" />;
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

const formatDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const DailyForecast: React.FC<DailyForecastProps> = ({ daily }) => {
  return (
    <motion.div
      className="w-full px-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/10">
        <h3 className="text-white/90 text-sm font-medium mb-4 uppercase tracking-wider">
          7-Day Forecast
        </h3>
        <div className="flex flex-col space-y-4">
          {daily.time.slice(0, 7).map((time, index) => (
            <div
              key={time}
              className="flex items-center justify-between text-white"
            >
              <span className="w-16 font-medium text-lg">
                {index === 0 ? "Today" : formatDay(time)}
              </span>
              <div className="flex items-center space-x-2">
                {getWeatherIcon(daily.weatherCode[index])}
              </div>
              <div className="flex items-center space-x-4 w-24 justify-end font-semibold text-lg">
                <span className="opacity-70">
                  {Math.round(daily.temperatureMin[index])}°
                </span>
                <span>{Math.round(daily.temperatureMax[index])}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyForecast;
