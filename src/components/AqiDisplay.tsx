import React from "react";
import { motion } from "motion/react";
import { Wind } from "lucide-react";

interface AqiDisplayProps {
  aqi?: number;
}

export const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "bg-green-500";
  if (aqi <= 100) return "bg-yellow-500";
  if (aqi <= 150) return "bg-orange-500";
  if (aqi <= 200) return "bg-red-500";
  if (aqi <= 300) return "bg-purple-500";
  return "bg-rose-900";
};

export const getAqiLabel = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const AqiDisplay: React.FC<AqiDisplayProps> = ({ aqi }) => {
  if (aqi === undefined) return null;

  return (
    <motion.div
      className="w-full px-4 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wind className="w-6 h-6 text-white/80" />
          <div>
            <h3 className="text-white/90 text-sm font-medium uppercase tracking-wider">
              Air Quality
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className={`w-3 h-3 rounded-full ${getAqiColor(aqi)} shadow-sm`}
              />
              <span className="text-white/80 text-xs font-medium">
                {getAqiLabel(aqi)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-white font-semibold text-2xl">{aqi}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AqiDisplay;
