import React from "react";
import { motion } from "motion/react";
import { CurrentWeather as CurrentWeatherType } from "../types";
import { getWeatherDescription } from "../services/weather";

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
  high: number;
  low: number;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  weather,
  high,
  low,
}) => {
  return (
    <motion.div
      className="flex flex-col items-center text-white mt-8 mb-4 px-4"
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
      <p className="text-xl font-bold mt-1 weather-hero-text capitalize">
        {getWeatherDescription(weather.weatherCode)}
      </p>
      <div className="flex space-x-4 mt-2 text-md font-semibold opacity-90 weather-hero-text">
        <span>L:{Math.round(low)}°</span>
        <span>H:{Math.round(high)}°</span>
      </div>
    </motion.div>
  );
};

export default CurrentWeather;
