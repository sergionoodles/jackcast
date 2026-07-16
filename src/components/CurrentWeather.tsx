import React from "react";
import { motion } from "motion/react";
import { CurrentWeather as CurrentWeatherType } from "../types";
import { getWeatherDescription } from "../services/weather";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import { getAqiColor } from "../utils/aqi";
import type { ClockFormat, UnitSystem } from "../config/preferences";
import {
  convertTemperature,
  formatClockTime,
  formatWindSpeed,
  getTemperatureUnit,
} from "../utils/weatherFormat";

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
  sunrise?: string;
  sunset?: string;
  unitSystem: UnitSystem;
  clockFormat: ClockFormat;
}

const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code <= 1) {
    return isDay ? (
      <Sun className="h-6 w-6 text-amber-300" aria-hidden="true" />
    ) : (
      <Moon className="h-6 w-6 text-sky-200" aria-hidden="true" />
    );
  }
  if (code === 2) {
    return <Cloud className="h-6 w-6 text-slate-200" aria-hidden="true" />;
  }
  if (code === 3 || code === 45 || code === 48) {
    return <CloudFog className="h-6 w-6 text-slate-300" aria-hidden="true" />;
  }
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className="h-6 w-6 text-cyan-200" aria-hidden="true" />;
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className="h-6 w-6 text-sky-300" aria-hidden="true" />;
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return <CloudSnow className="h-6 w-6 text-white" aria-hidden="true" />;
  }
  if (code >= 95) {
    return (
      <CloudLightning className="h-6 w-6 text-yellow-200" aria-hidden="true" />
    );
  }

  return <Sun className="h-6 w-6 text-amber-300" aria-hidden="true" />;
};

const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  weather,
  sunrise: sunriseTime,
  sunset: sunsetTime,
  unitSystem,
  clockFormat,
}) => {
  const sunrise = sunriseTime
    ? formatClockTime(sunriseTime, clockFormat, true)
    : null;
  const sunset = sunsetTime
    ? formatClockTime(sunsetTime, clockFormat, true)
    : null;

  return (
    <motion.div
      className="flex flex-col items-center text-white mt-5 mb-4 px-3"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="relative mt-2">
        <span className="text-8xl font-bold weather-temp-text">
          {Math.round(convertTemperature(weather.temperature, unitSystem))}
        </span>
        <span className="absolute left-full top-2 ml-1 whitespace-nowrap text-3xl font-bold weather-hero-text">
          {getTemperatureUnit(unitSystem)}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-2 text-2xl font-bold weather-hero-text capitalize">
        {getWeatherIcon(weather.weatherCode, weather.isDay)}
        {getWeatherDescription(weather.weatherCode)}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-white/90 weather-hero-text">
        <span className="weather-chip inline-flex items-center gap-1 rounded-full shadow-lg border border-white/10 px-2 py-1">
          <Wind className="h-4 w-4" />
          {formatWindSpeed(weather.windSpeed, unitSystem)}
        </span>
        <span className="weather-chip inline-flex items-center gap-1 rounded-full shadow-lg border border-white/10 px-2 py-1">
          <Droplets className="h-4 w-4" />
          {Math.round(weather.humidity)}%
        </span>
        {typeof weather.aqi === "number" && (
          <span className="weather-chip inline-flex items-center gap-1.5 rounded-full shadow-lg border border-white/10 px-2.5 py-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${getAqiColor(weather.aqi)} shadow-sm`}
            />
            AQI {Math.round(weather.aqi)}
          </span>
        )}
      </div>
      {sunrise || sunset ? (
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-white/90 weather-hero-text">
          {sunrise && (
            <span className="weather-chip inline-flex items-center gap-1.5 rounded-full shadow-lg border border-white/10 px-2.5 py-1">
              <span className="weather-chip-label">Sunrise</span>
              {sunrise}
            </span>
          )}
          {sunset && (
            <span className="weather-chip inline-flex items-center gap-1.5 rounded-full shadow-lg border border-white/10 px-2.5 py-1">
              <span className="weather-chip-label">Sunset</span>
              {sunset}
            </span>
          )}
        </div>
      ) : null}
    </motion.div>
  );
};

export default CurrentWeather;
