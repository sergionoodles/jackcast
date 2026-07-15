import React from "react";
import { motion } from "motion/react";
import {
  getBackgroundImageUrl,
  getWeatherCategory,
  getTimeOfDay,
} from "../config/backgrounds";
import { getTheme, type ThemeId } from "../config/themes";
import type { Location } from "../types";

interface WeatherBackgroundProps {
  weatherCode: number;
  location: Location;
  themeId: ThemeId;
  showImage?: boolean;
  hideGradient?: boolean;
  children: React.ReactNode;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherCode,
  location,
  themeId,
  showImage = true,
  hideGradient = false,
  children,
}) => {
  const category = getWeatherCategory(weatherCode);
  const timeOfDay = getTimeOfDay();
  const theme = getTheme(themeId);
  const imageUrl = getBackgroundImageUrl(
    themeId,
    category,
    timeOfDay,
    location,
  );

  return (
    <div
      className={`weather-app ${theme.className} min-h-[100dvh] w-full flex items-center justify-center p-0 m-0`}
      data-theme={theme.id}
    >
      <motion.div
        className="weather-shell app-safe-shell z-10 w-full lg:aspect-[9/18] lg:max-h-[1200px] lg:w-auto lg:relative h-[100dvh] transition-colors duration-1000 ease-in-out relative overflow-hidden flex flex-col lg:rounded-2xl lg:shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Background Image Overlay */}
        {showImage && (
          <div
            className="weather-bg-image absolute inset-0 z-0 opacity-100 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `url(${imageUrl}), url(${theme.fallbackBackground})`,
            }}
          />
        )}

        {/* Gradient overlay for text contrast */}
        <div
          className={`weather-overlay absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ease-out ${
            hideGradient ? "opacity-0" : "opacity-100"
          }`}
        />

        <div className="relative z-10 h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default WeatherBackground;
