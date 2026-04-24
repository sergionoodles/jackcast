import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Search, MapPin, Heart, Loader2 } from "lucide-react";
import { Location, WeatherData } from "./types";
import { getWeatherData } from "./services/weather";
import WeatherBackground from "./components/WeatherBackground";
import CurrentWeather from "./components/CurrentWeather";
import HourlyForecast from "./components/HourlyForecast";
import DailyForecast from "./components/DailyForecast";
import LocationSearch from "./components/LocationSearch";
import InstallPrompt from "./components/InstallPrompt";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

type RefreshSource =
  | "initial-load"
  | "location-select"
  | "interval"
  | "activate";

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGpsLocation, setIsGpsLocation] = useState(true);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);

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

  const fetchWeatherForCoords = useCallback(
    async (
      lat: number,
      lon: number,
      source: RefreshSource,
      options?: { guardInFlight?: boolean },
    ) => {
      const shouldGuard = options?.guardInFlight ?? false;
      if (shouldGuard && refreshInFlightRef.current) {
        return null;
      }

      if (shouldGuard) {
        refreshInFlightRef.current = true;
      }

      try {
        const weather = await getWeatherData(lat, lon);
        if (weather) {
          setWeatherData(weather);
          lastSuccessfulRefreshAtRef.current = Date.now();
          return weather;
        }

        if (import.meta.env.DEV) {
          console.warn(`Weather refresh returned no data (${source}).`);
        }
        return null;
      } finally {
        if (shouldGuard) {
          refreshInFlightRef.current = false;
        }
      }
    },
    [],
  );

  const refreshCurrentLocationWeather = useCallback(
    async (source: Extract<RefreshSource, "interval" | "activate">) => {
      if (!currentLocation) {
        return null;
      }

      return fetchWeatherForCoords(
        currentLocation.latitude,
        currentLocation.longitude,
        source,
        { guardInFlight: true },
      );
    },
    [currentLocation, fetchWeatherForCoords],
  );

  const fetchInitialWeather = useCallback(async () => {
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
            await fetchWeatherForCoords(lat, lon, "initial-load");
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
            await fetchWeatherForCoords(lat, lon, "initial-load");
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
          await fetchWeatherForCoords(
            loc.latitude,
            loc.longitude,
            "initial-load",
          );
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
      await fetchWeatherForCoords(loc.latitude, loc.longitude, "initial-load");
      setIsLoading(false);
    }
  }, [fetchWeatherForCoords]);

  // Initial load - try geolocation, fallback to default (London)
  useEffect(() => {
    fetchInitialWeather();
  }, [fetchInitialWeather]);

  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshCurrentLocationWeather("interval");
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentLocation, refreshCurrentLocationWeather]);

  useEffect(() => {
    const maybeRefreshIfStale = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (!currentLocation) {
        return;
      }
      if (lastSuccessfulRefreshAtRef.current === null) {
        return;
      }
      if (Date.now() - lastSuccessfulRefreshAtRef.current < REFRESH_INTERVAL_MS) {
        return;
      }

      void refreshCurrentLocationWeather("activate");
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        maybeRefreshIfStale();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", maybeRefreshIfStale);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", maybeRefreshIfStale);
    };
  }, [currentLocation, refreshCurrentLocationWeather]);

  const handleSelectCurrentLocation = () => {
    setIsSearching(false);
    fetchInitialWeather();
  };

  const handleSelectLocation = async (location: Location) => {
    setIsSearching(false);
    setIsLoading(true);
    const weather = await fetchWeatherForCoords(
      location.latitude,
      location.longitude,
      "location-select",
    );
    if (weather) {
      setCurrentLocation(location);
      setIsGpsLocation(false);
    }
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
      <header className="flex justify-between items-center gap-3 p-4 text-white z-20 bg-linear-to-b from-mist-900 via-60 via-mist-900/70 to-mist-900/30 backdrop-blur-md shadow-lg ring ring-white/10">
        <div className="flex items-center min-w-0 flex-1">
          <div className="min-w-0 flex items-center gap-2">
            {isGpsLocation && <MapPin className="w-5 h-5 shrink-0" />}
            <h1 className="min-w-0">
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className="block truncate text-left text-xl font-medium tracking-wide weather-hero-text cursor-pointer"
                title={currentLocation.name}
                aria-label="Open location search panel"
              >
                {currentLocation.name}
              </button>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isGpsLocation && (
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
          )}
          <button
            onClick={() => setIsSearching(true)}
            type="button"
            aria-label="Search for a city"
            className="p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main className="relative flex-1 min-h-0 overflow-y-auto scrollbar-hide scroll-touch z-10 flex flex-col">
        <div className="flex flex-col h-full shrink-0">
          <div className="sticky top-0 z-20">
            <CurrentWeather weather={weatherData.current} />
          </div>

          <div className="flex-1" />
        </div>

        <div className="sticky bottom-0 z-20 shrink-0">
          <HourlyForecast
            hourly={weatherData.hourly}
            currentTime={currentTime}
          />
        </div>

        <div className="flex flex-col shrink-0">
          <DailyForecast
            daily={weatherData.daily}
            hourly={weatherData.hourly}
          />

          {/* Footer */}
          <footer className="relative w-full pt-8 pb-4 text-center text-white/90 drop-shadow-md text-xs mt-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0 pointer-events-none" />
            <p className="relative z-10 font-medium">
              Weather data provided by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white font-semibold transition-colors"
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
            favorites={favorites}
            onSelect={handleSelectLocation}
            onSelectCurrentLocation={handleSelectCurrentLocation}
            onRemove={removeFavorite}
            onClose={() => setIsSearching(false)}
          />
        )}
      </AnimatePresence>
    </WeatherBackground>
  );
}
