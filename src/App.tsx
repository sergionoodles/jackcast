import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Heart, Menu, Loader2 } from "lucide-react";
import { Location, WeatherData } from "./types";
import { getWeatherData } from "./services/weather";
import WeatherBackground from "./components/WeatherBackground";
import CurrentWeather from "./components/CurrentWeather";
import HourlyForecast from "./components/HourlyForecast";
import DailyForecast from "./components/DailyForecast";
import LocationSearch from "./components/LocationSearch";
import FavoritesDrawer from "./components/FavoritesDrawer";
import AqiDisplay from "./components/AqiDisplay";
import InstallPrompt from "./components/InstallPrompt";

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGpsLocation, setIsGpsLocation] = useState(true);

  // Load favorites from local storage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("froggyFavorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Save favorites to local storage
  useEffect(() => {
    localStorage.setItem("froggyFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchInitialWeather = async () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // Simple reverse geocoding using Open-Meteo search (not perfect but works for demo)
          try {
            const res = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1&language=en&format=json`,
            );
            const data = await res.json();
            const locName = data.results?.[0]?.name || "Current Location";
            const loc: Location = {
              id: Date.now(),
              name: locName,
              latitude: lat,
              longitude: lon,
            };
            setCurrentLocation(loc);
            setIsGpsLocation(true);
            const weather = await getWeatherData(lat, lon);
            setWeatherData(weather);
          } catch (e) {
            // Fallback if reverse geocoding fails
            const loc: Location = {
              id: Date.now(),
              name: "Current Location",
              latitude: lat,
              longitude: lon,
            };
            setCurrentLocation(loc);
            setIsGpsLocation(true);
            const weather = await getWeatherData(lat, lon);
            setWeatherData(weather);
          }
          setIsLoading(false);
        },
        async () => {
          // Fallback to London
          const loc: Location = {
            id: 2643743,
            name: "London",
            latitude: 51.5085,
            longitude: -0.1257,
            country: "United Kingdom",
          };
          setCurrentLocation(loc);
          setIsGpsLocation(false);
          const weather = await getWeatherData(loc.latitude, loc.longitude);
          setWeatherData(weather);
          setIsLoading(false);
        },
      );
    } else {
      // Fallback to London
      const loc: Location = {
        id: 2643743,
        name: "London",
        latitude: 51.5085,
        longitude: -0.1257,
        country: "United Kingdom",
      };
      setCurrentLocation(loc);
      setIsGpsLocation(false);
      const weather = await getWeatherData(loc.latitude, loc.longitude);
      setWeatherData(weather);
      setIsLoading(false);
    }
  };

  // Initial load - try geolocation, fallback to default (London)
  useEffect(() => {
    fetchInitialWeather();
  }, []);

  const handleSelectCurrentLocation = () => {
    setIsDrawerOpen(false);
    fetchInitialWeather();
  };

  const handleSelectLocation = async (location: Location) => {
    setIsSearching(false);
    setIsDrawerOpen(false);
    setIsLoading(true);
    setCurrentLocation(location);
    setIsGpsLocation(false);
    const weather = await getWeatherData(location.latitude, location.longitude);
    setWeatherData(weather);
    setIsLoading(false);
  };

  const toggleFavorite = () => {
    if (!currentLocation) return;

    const isFavorite = favorites.some((f) => f.id === currentLocation.id);
    if (isFavorite) {
      setFavorites(favorites.filter((f) => f.id !== currentLocation.id));
    } else {
      setFavorites([...favorites, currentLocation]);
    }
  };

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  if (isLoading || !weatherData || !currentLocation) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-mist-900 via-mist-800 to-mist-900 flex items-center justify-center p-0 m-0">
        <div className="w-full lg:aspect-[9/18] lg:max-h-[1200px] lg:w-auto lg:relative h-[100dvh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      </div>
    );
  }

  const isFavorite = favorites.some((f) => f.id === currentLocation.id);
  const currentTime = new Date().toISOString(); // Approximate current time for hourly forecast

  return (
    <WeatherBackground
      weatherCode={weatherData.current.weatherCode}
      isDay={weatherData.current.isDay}
    >
      <InstallPrompt />
      {/* Header */}
      <header className="flex justify-between items-center p-4 text-white z-20 bg-linear-to-b from-mist-900 via-60 via-mist-900/70 to-mist-900/30 backdrop-blur-md shadow-lg ring ring-white/10">
        <button
          onClick={() => setIsSearching(true)}
          type="button"
          aria-label="Search for a city"
          className="p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          <Search className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFavorite}
            type="button"
            aria-label={
              isFavorite
                ? "Remove current location from favorites"
                : "Save current location to favorites"
            }
            className="p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Heart
              className={`w-6 h-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`}
            />
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            type="button"
            aria-label="Open saved locations"
            className="p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide z-10 flex flex-col">
        <div className="flex flex-col h-full shrink-0">
          <CurrentWeather
            weather={weatherData.current}
            locationName={currentLocation.name}
            high={weatherData.daily.temperatureMax[0]}
            low={weatherData.daily.temperatureMin[0]}
            isCurrentLocation={isGpsLocation}
          />

          <div className="flex-1" />

          <div className="shrink-0">
            <HourlyForecast
              hourly={weatherData.hourly}
              currentTime={currentTime}
            />
          </div>
        </div>

        <div className="flex flex-col shrink-0">
          <AqiDisplay aqi={weatherData.current.aqi} />
          <DailyForecast daily={weatherData.daily} />

          {/* Footer */}
          <footer className="w-full py-4 text-center text-white/90 drop-shadow-md text-xs mt-6">
            <p>
              Weather data provided by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white font-medium transition-colors"
              >
                Open-Meteo
              </a>
            </p>
          </footer>
        </div>
      </main>

      {/* Modals / Drawers */}
      <AnimatePresence>
        {isSearching && (
          <LocationSearch
            onSelect={handleSelectLocation}
            onClose={() => setIsSearching(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDrawerOpen && (
          <FavoritesDrawer
            favorites={favorites}
            onSelect={handleSelectLocation}
            onSelectCurrentLocation={handleSelectCurrentLocation}
            onRemove={removeFavorite}
            onClose={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
    </WeatherBackground>
  );
}
