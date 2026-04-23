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
  humidity: number;
  windSpeed: number;
  windDirection: number;
  aqi?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature: number[];
  weatherCode: number[];
  humidity: number[];
  windSpeed: number[];
  windDirection: number[];
  precipitationProbability: number[];
  aqi?: Array<number | undefined>;
}

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  windSpeedMax: number[];
  windDirectionDominant: number[];
  humidityMean: number[];
  precipitationProbabilityMax: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
}
