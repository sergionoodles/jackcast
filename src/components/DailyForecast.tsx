import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DailyForecast as DailyForecastType,
  HourlyForecast as HourlyForecastType,
} from "../types";
import { getAqiColor } from "./AqiDisplay";
import {
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Moon,
  Sun,
  Wind,
} from "lucide-react";

interface DailyForecastProps {
  daily: DailyForecastType;
  hourly: HourlyForecastType;
}

const getWeatherIcon = (code: number, isDay = true) => {
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

const formatDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  return date.toLocaleTimeString([], { hour: "numeric" });
};

const DailyForecast: React.FC<DailyForecastProps> = ({ daily, hourly }) => {
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0);

  const dailyRows = useMemo(
    () =>
      daily.time.slice(0, 7).map((day, index) => {
        const hourlyIndexes: number[] = [];
        for (let i = 0; i < hourly.time.length; i += 1) {
          const hourTime = hourly.time[i];
          if (hourTime?.startsWith(day)) {
            hourlyIndexes.push(i);
          }
        }

        let dailyAqiMax: number | undefined = undefined;
        if (hourly.aqi) {
          const dayAqiValues = hourlyIndexes
            .map((hourIndex) => hourly.aqi?.[hourIndex])
            .filter((value): value is number => typeof value === "number");

          if (dayAqiValues.length > 0) {
            dailyAqiMax = Math.max(...dayAqiValues);
          }
        }

        return { day, index, hourlyIndexes, dailyAqiMax };
      }),
    [daily.time, hourly.time, hourly.aqi],
  );

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
        <div className="flex flex-col divide-y divide-white/10">
          {dailyRows.map(({ day, index, hourlyIndexes, dailyAqiMax }) => {
            const isExpanded = expandedDayIndex === index;
            return (
              <div key={day} className="py-3">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`daily-forecast-panel-${index}`}
                  onClick={() =>
                    setExpandedDayIndex((prevIndex) =>
                      prevIndex === index ? null : index,
                    )
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2 text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-24 font-medium text-base">
                        {index === 0 ? "Today" : formatDay(day)}
                      </span>
                      {getWeatherIcon(daily.weatherCode[index] ?? 0)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-3 w-24 justify-end font-semibold text-lg">
                        <span className="opacity-70">
                          {Math.round(daily.temperatureMin[index] ?? 0)}°
                        </span>
                        <span>{Math.round(daily.temperatureMax[index] ?? 0)}°</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-white/70 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/85 font-medium">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                      <Wind className="h-3.5 w-3.5" />
                      {Math.round(daily.windSpeedMax[index] ?? 0)} km/h
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                      <Droplets className="h-3.5 w-3.5" />
                      {Math.round(daily.humidityMean[index] ?? 0)}%
                    </span>
                    {(daily.precipitationProbabilityMax[index] ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                        <CloudRain className="h-3.5 w-3.5 text-blue-300" />
                        {Math.round(daily.precipitationProbabilityMax[index] ?? 0)}%
                      </span>
                    )}
                    {typeof dailyAqiMax === "number" && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5"
                        title={`Max AQI ${Math.round(dailyAqiMax)}`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getAqiColor(dailyAqiMax)} shadow-sm`}
                        />
                        AQI {Math.round(dailyAqiMax)}
                      </span>
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={`daily-forecast-panel-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        {hourlyIndexes.length === 0 ? (
                          <div className="text-white/70 text-sm">
                            No hourly data available.
                          </div>
                        ) : (
                          <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-4">
                            {hourlyIndexes.map((hourIndex) => {
                              const time = hourly.time[hourIndex];
                              const code = hourly.weatherCode[hourIndex];
                              const temperature = hourly.temperature[hourIndex];

                              if (
                                time === undefined ||
                                code === undefined ||
                                temperature === undefined
                              ) {
                                return null;
                              }

                              const date = new Date(time);
                              const isDay = date.getHours() >= 6 && date.getHours() < 18;
                              const hourAqi = hourly.aqi?.[hourIndex];

                              return (
                                <div
                                  key={time}
                                  className="flex min-w-[92px] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white"
                                >
                                  <span className="text-xs font-medium text-white/90">
                                    {formatTime(time)}
                                  </span>
                                  {getWeatherIcon(code, isDay)}
                                  {(hourly.precipitationProbability[hourIndex] ?? 0) >
                                    0 && (
                                    <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-white/80">
                                      <CloudRain className="h-3.5 w-3.5 text-blue-300" />
                                      {Math.round(
                                        hourly.precipitationProbability[
                                          hourIndex
                                        ] ?? 0,
                                      )}
                                      %
                                    </span>
                                  )}
                                  <span className="text-sm font-semibold">
                                    {Math.round(temperature)}°
                                  </span>
                                  {typeof hourAqi === "number" && (
                                    <span className="flex items-center gap-1 text-[11px] text-white/80">
                                      <span
                                        className={`w-2 h-2 rounded-full ${getAqiColor(hourAqi)}`}
                                      />
                                      AQI {Math.round(hourAqi)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyForecast;
