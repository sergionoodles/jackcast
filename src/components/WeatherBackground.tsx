import React from "react";
import { motion } from "motion/react";
import {
  getBackgroundImageUrl,
  getWeatherCategory,
  getTimeOfDay,
} from "../config/backgrounds";
import type { Location } from "../types";

interface WeatherBackgroundProps {
  weatherCode: number;
  location: Location;
  children: React.ReactNode;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherCode,
  location,
  children,
}) => {
  const category = getWeatherCategory(weatherCode);
  const timeOfDay = getTimeOfDay();
  const imageUrl = getBackgroundImageUrl(category, timeOfDay, location);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-mist-900 via-mist-800 to-mist-900 flex items-center justify-center p-0 m-0">
      <motion.div
        className={`z-10 w-full lg:aspect-[9/18] lg:max-h-[1200px] lg:w-auto lg:relative h-[100dvh] pt-[env(safe-area-inset-top)] bg-linear-to-b from-gray-700 via-25% via-gray-700/70 to-40% to-gray-700/0 transition-colors duration-1000 ease-in-out relative overflow-hidden flex flex-col lg:rounded-2xl lg:shadow-lg`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-100 mix-blend-overlay bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url(${imageUrl}), url('/backgrounds/clear-afternoon-1.jpeg')`,
          }}
        />

        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 z-0 pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default WeatherBackground;
