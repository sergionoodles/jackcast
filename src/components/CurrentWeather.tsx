import React from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { CurrentWeather as CurrentWeatherType } from '../types';
import { getWeatherDescription } from '../services/weather';

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
  locationName: string;
  high: number;
  low: number;
  isCurrentLocation?: boolean;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ weather, locationName, high, low, isCurrentLocation }) => {
  return (
    <motion.div
      className="flex flex-col items-center text-white mt-8 mb-4 px-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <h1 className="text-3xl font-medium tracking-wide drop-shadow-md flex items-center justify-center">
        {isCurrentLocation && <MapPin className="w-6 h-6 mr-2" />}
        {locationName}
      </h1>
      <div className="flex items-start mt-2">
        <span className="text-7xl font-light tracking-tighter drop-shadow-lg">
          {Math.round(weather.temperature)}
        </span>
        <span className="text-3xl font-light mt-2 drop-shadow-md">°</span>
      </div>
      <p className="text-xl font-medium mt-1 drop-shadow-md capitalize">
        {getWeatherDescription(weather.weatherCode)}
      </p>
      <div className="flex space-x-4 mt-2 text-sm font-medium opacity-90 drop-shadow-sm">
        <span>H:{Math.round(high)}°</span>
        <span>L:{Math.round(low)}°</span>
      </div>
    </motion.div>
  );
};

export default CurrentWeather;
