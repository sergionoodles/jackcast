import React from "react";
import { motion } from "motion/react";
import { CurrentWeather as CurrentWeatherType } from "../types";
import { getWeatherDescription } from "../services/weather";
import { Droplets, Wind } from "lucide-react";
import { getAqiColor } from "../utils/aqi";

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ weather }) => {
  return (
    <motion.div
      className="flex flex-col items-center text-white mt-8 mb-4 px-3"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-start mt-2">
        <span className="text-8xl font-bold weather-temp-text">
          {Math.round(weather.temperature)}
        </span>
        <span className="text-5xl font-bold mt-1 ml-1 weather-hero-text">
          °
        </span>
      </div>
      <p className="text-2xl font-bold mt-1 weather-hero-text capitalize">
        {getWeatherDescription(weather.weatherCode)}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-white/90 weather-hero-text">
        {typeof weather.aqi === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mist-900/40 shadow-lg border border-white/10 px-2.5 py-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${getAqiColor(weather.aqi)} shadow-sm`}
            />
            AQI {Math.round(weather.aqi)}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-mist-900/40 shadow-lg border border-white/10 px-2 py-1">
          <Wind className="h-4 w-4 text-white/90" />
          {Math.round(weather.windSpeed)} km/h
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-mist-900/40 shadow-lg border border-white/10 px-2 py-1">
          <Droplets className="h-4 w-4 text-white/90" />
          {Math.round(weather.humidity)}%
        </span>
      </div>
    </motion.div>
  );
};

export default CurrentWeather;
