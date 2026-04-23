import { Location, WeatherData } from '../types';

export const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query) return [];
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
};

export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`).catch(() => null)
    ]);
    
    const data = await weatherRes.json();
    let aqi = undefined;
    
    if (aqiRes && aqiRes.ok) {
      const aqiData = await aqiRes.json();
      aqi = aqiData.current?.us_aqi;
    }
    
    return {
      current: {
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        aqi,
      },
      hourly: {
        time: data.hourly.time,
        temperature: data.hourly.temperature_2m,
        weatherCode: data.hourly.weather_code,
      },
      daily: {
        time: data.daily.time,
        weatherCode: data.daily.weather_code,
        temperatureMax: data.daily.temperature_2m_max,
        temperatureMin: data.daily.temperature_2m_min,
      },
      timezone: data.timezone,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

export type WeatherCategory = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';

type WeatherCodeInfo = {
  id: string;
  description: string;
  category: WeatherCategory;
};

export const WEATHER_CODE_INFO: Record<number, WeatherCodeInfo> = {
  0: { id: 'clear-sky', description: 'Clear sky', category: 'clear' },
  1: { id: 'mainly-clear', description: 'Mainly clear', category: 'clear' },
  2: { id: 'partly-cloudy', description: 'Partly cloudy', category: 'cloudy' },
  3: { id: 'overcast', description: 'Overcast', category: 'cloudy' },
  45: { id: 'fog', description: 'Fog', category: 'cloudy' },
  48: { id: 'depositing-rime-fog', description: 'Depositing rime fog', category: 'cloudy' },
  51: { id: 'light-drizzle', description: 'Light drizzle', category: 'rain' },
  53: { id: 'moderate-drizzle', description: 'Moderate drizzle', category: 'rain' },
  55: { id: 'dense-drizzle', description: 'Dense drizzle', category: 'rain' },
  56: { id: 'light-freezing-drizzle', description: 'Light freezing drizzle', category: 'rain' },
  57: { id: 'dense-freezing-drizzle', description: 'Dense freezing drizzle', category: 'rain' },
  61: { id: 'slight-rain', description: 'Slight rain', category: 'rain' },
  63: { id: 'moderate-rain', description: 'Moderate rain', category: 'rain' },
  65: { id: 'heavy-rain', description: 'Heavy rain', category: 'rain' },
  66: { id: 'light-freezing-rain', description: 'Light freezing rain', category: 'rain' },
  67: { id: 'heavy-freezing-rain', description: 'Heavy freezing rain', category: 'rain' },
  71: { id: 'slight-snow-fall', description: 'Slight snow fall', category: 'snow' },
  73: { id: 'moderate-snow-fall', description: 'Moderate snow fall', category: 'snow' },
  75: { id: 'heavy-snow-fall', description: 'Heavy snow fall', category: 'snow' },
  77: { id: 'snow-grains', description: 'Snow grains', category: 'snow' },
  80: { id: 'slight-rain-showers', description: 'Slight rain showers', category: 'rain' },
  81: { id: 'moderate-rain-showers', description: 'Moderate rain showers', category: 'rain' },
  82: { id: 'violent-rain-showers', description: 'Violent rain showers', category: 'rain' },
  85: { id: 'slight-snow-showers', description: 'Slight snow showers', category: 'snow' },
  86: { id: 'heavy-snow-showers', description: 'Heavy snow showers', category: 'snow' },
  95: { id: 'thunderstorm', description: 'Thunderstorm', category: 'storm' },
  96: { id: 'thunderstorm-with-slight-hail', description: 'Thunderstorm with slight hail', category: 'storm' },
  99: { id: 'thunderstorm-with-heavy-hail', description: 'Thunderstorm with heavy hail', category: 'storm' },
};

export const getWeatherDescription = (code: number): string => {
  return WEATHER_CODE_INFO[code]?.description || 'Unknown';
};

export const getWeatherConditionId = (code: number): string => {
  return WEATHER_CODE_INFO[code]?.id || 'unknown';
};

export const getWeatherCategory = (code: number): WeatherCategory => {
  return WEATHER_CODE_INFO[code]?.category || 'clear';
};
