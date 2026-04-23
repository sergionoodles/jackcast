export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  aqi?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature: number[];
  weatherCode: number[];
}

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
}
