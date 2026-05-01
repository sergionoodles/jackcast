import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DailyForecast as DailyForecastType,
  HourlyForecast as HourlyForecastType,
} from "../types";
import { getAqiColor } from "../utils/aqi";
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
  currentTime: string;
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

const DailyForecast: React.FC<DailyForecastProps> = ({
  daily,
  hourly,
  currentTime,
}) => {
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0);
  const now = new Date(currentTime);
  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  const dailyRows = useMemo(
    () =>
      daily.time.slice(0, 7).map((day, index) => {
        const hourlyIndexes: number[] = [];
        for (let i = 0; i < hourly.time.length; i += 1) {
          const hourTime = hourly.time[i];
          if (!hourTime?.startsWith(day)) {
            continue;
          }

          if (index === 0 && new Date(hourTime) < currentHourStart) {
            continue;
          }

          hourlyIndexes.push(i);
        }

        const dayWindValues = hourlyIndexes
          .map((hourIndex) => hourly.windSpeed[hourIndex])
          .filter((value): value is number => typeof value === "number");
        const dayHumidityValues = hourlyIndexes
          .map((hourIndex) => hourly.humidity[hourIndex])
          .filter((value): value is number => typeof value === "number");
        const dayRainChanceValues = hourlyIndexes
          .map((hourIndex) => hourly.precipitationProbability[hourIndex])
          .filter((value): value is number => typeof value === "number");
        const dayAqiValues = hourlyIndexes
          .map((hourIndex) => hourly.aqi?.[hourIndex])
          .filter((value): value is number => typeof value === "number");

        const dailyWindMax =
          dayWindValues.length > 0
            ? Math.max(...dayWindValues)
            : (daily.windSpeedMax[index] ?? 0);
        const dailyHumidityAvg =
          dayHumidityValues.length > 0
            ? dayHumidityValues.reduce((sum, value) => sum + value, 0) /
              dayHumidityValues.length
            : (daily.humidityMean[index] ?? 0);
        const dailyRainChanceAvg =
          dayRainChanceValues.length > 0
            ? dayRainChanceValues.reduce((sum, value) => sum + value, 0) /
              dayRainChanceValues.length
            : (daily.precipitationProbabilityMax[index] ?? 0);
        const dailyAqiAvg =
          dayAqiValues.length > 0
            ? dayAqiValues.reduce((sum, value) => sum + value, 0) /
              dayAqiValues.length
            : undefined;

        return {
          day,
          index,
          hourlyIndexes,
          dailyWindMax,
          dailyHumidityAvg,
          dailyRainChanceAvg,
          dailyAqiAvg,
        };
      }),
    [
      daily.time,
      daily.windSpeedMax,
      daily.humidityMean,
      daily.precipitationProbabilityMax,
      hourly.time,
      hourly.windSpeed,
      hourly.humidity,
      hourly.precipitationProbability,
      hourly.aqi,
      currentHourStart,
    ],
  );

  return (
    <motion.div
      className="w-full px-3 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/10">
        <h3 className="text-white/90 text-sm font-medium mb-4 uppercase tracking-wider">
          7-Day Forecast
        </h3>
        <div className="flex flex-col divide-y divide-white/10">
          {dailyRows.map(
            ({
              day,
              index,
              hourlyIndexes,
              dailyWindMax,
              dailyHumidityAvg,
              dailyRainChanceAvg,
              dailyAqiAvg,
            }) => {
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
                          <span>
                            {Math.round(daily.temperatureMax[index] ?? 0)}°
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-white/70 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/85 font-medium">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                        <Wind className="h-3.5 w-3.5" />
                        {Math.round(dailyWindMax)} km/h
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                        <Droplets className="h-3.5 w-3.5" />
                        {Math.round(dailyHumidityAvg)}%
                      </span>
                      {dailyRainChanceAvg > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                          <CloudRain className="h-3.5 w-3.5 text-blue-300" />
                          {Math.round(dailyRainChanceAvg)}%
                        </span>
                      )}
                      {typeof dailyAqiAvg === "number" && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5"
                          title={`Avg AQI ${Math.round(dailyAqiAvg)}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${getAqiColor(dailyAqiAvg)} shadow-sm`}
                          />
                          AQI {Math.round(dailyAqiAvg)}
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
                            <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-2.5">
                              {hourlyIndexes.map((hourIndex) => {
                                const time = hourly.time[hourIndex];
                                const code = hourly.weatherCode[hourIndex];
                                const temperature =
                                  hourly.temperature[hourIndex];

                                if (
                                  time === undefined ||
                                  code === undefined ||
                                  temperature === undefined
                                ) {
                                  return null;
                                }

                                const date = new Date(time);
                                const isDay =
                                  date.getHours() >= 6 && date.getHours() < 18;
                                const hourAqi = hourly.aqi?.[hourIndex];
                                const hasRainIndicator =
                                  (hourly.precipitationProbability[hourIndex] ??
                                    0) > 0;

                                return (
                                  <div
                                    key={time}
                                    className="flex min-w-[94px] flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-white"
                                  >
                                    <span className="text-xs font-medium text-white/90">
                                      {formatTime(time)}
                                    </span>
                                    {getWeatherIcon(code, isDay)}
                                    <span className="text-sm font-semibold">
                                      {Math.round(temperature)}°
                                    </span>
                                    <span className="flex min-h-4 items-center gap-1.5 text-[11px] text-white/80">
                                      {hasRainIndicator && (
                                        <span className="flex items-center gap-1 whitespace-nowrap">
                                          <CloudRain className="h-3.5 w-3.5 text-blue-300" />
                                          {Math.round(
                                            hourly.precipitationProbability[
                                              hourIndex
                                            ] ?? 0,
                                          )}
                                          %
                                        </span>
                                      )}
                                      {typeof hourAqi === "number" && (
                                        <span className="flex items-center gap-1 whitespace-nowrap">
                                          <span
                                            className={`w-2 h-2 rounded-full ${getAqiColor(hourAqi)}`}
                                          />
                                          {hasRainIndicator
                                            ? Math.round(hourAqi)
                                            : `AQI ${Math.round(hourAqi)}`}
                                        </span>
                                      )}
                                    </span>
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
            },
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyForecast;
