import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
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
const SWIPE_MIN_DISTANCE_PX = 72;
const SWIPE_MAX_VERTICAL_DRIFT_PX = 96;
const SWIPE_MAX_DRAG_PX = 96;
const SWIPE_DRAG_RESISTANCE = 0.42;
const SWIPE_EXIT_DISTANCE_PX = 160;

type RefreshSource =
  | "initial-load"
  | "location-select"
  | "interval"
  | "activate";
type LoadingPhase = "idle" | "location" | "weather";

const FALLBACK_LOCATION: Location = {
  id: 3173435,
  name: "Milan",
  latitude: 45.4642,
  longitude: 9.19,
  country: "Italy",
};

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [favorites, setFavorites] = useState<Location[]>(() => {
    try {
      const storedFavorites = localStorage.getItem("froggyFavorites");
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch {
      return [];
    }
  });
  const [isSearching, setIsSearching] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("location");
  const [isGpsLocation, setIsGpsLocation] = useState(true);
  const [isMinimal, setIsMinimal] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  const activeRequestTokenRef = useRef(0);
  const favoritesRef = useRef(favorites);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeX = useMotionValue(0);
  const swipeOpacity = useMotionValue(1);

  // Save favorites to local storage
  useEffect(() => {
    favoritesRef.current = favorites;
    localStorage.setItem("froggyFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeatherForCoords = useCallback(
    async (
      lat: number,
      lon: number,
      source: RefreshSource,
      options?: { guardInFlight?: boolean; requestToken?: number },
    ) => {
      const shouldGuard = options?.guardInFlight ?? false;
      const requestToken = options?.requestToken;

      if (shouldGuard && refreshInFlightRef.current) {
        return null;
      }

      if (shouldGuard) {
        refreshInFlightRef.current = true;
      }

      try {
        const weather = await getWeatherData(lat, lon);
        if (weather) {
          if (
            typeof requestToken === "number" &&
            requestToken !== activeRequestTokenRef.current
          ) {
            return weather;
          }

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

  const beginTrackedRequest = useCallback(() => {
    activeRequestTokenRef.current += 1;
    return activeRequestTokenRef.current;
  }, []);

  const isTrackedRequestActive = useCallback((requestToken: number) => {
    return requestToken === activeRequestTokenRef.current;
  }, []);

  const fetchInitialWeather = useCallback(async () => {
    const requestToken = beginTrackedRequest();
    setLoadingPhase("location");
    setIsGpsLocation(true);

    const applyLocationFallback = async () => {
      if (!isTrackedRequestActive(requestToken)) {
        return;
      }

      const fallbackLocation = favoritesRef.current[0] ?? FALLBACK_LOCATION;
      setCurrentLocation(fallbackLocation);
      setIsGpsLocation(false);
      setLoadingPhase("weather");

      await fetchWeatherForCoords(
        fallbackLocation.latitude,
        fallbackLocation.longitude,
        "initial-load",
        { requestToken },
      );

      if (isTrackedRequestActive(requestToken)) {
        setLoadingPhase("idle");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isTrackedRequestActive(requestToken)) {
            return;
          }

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLoadingPhase("weather");

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
            if (isTrackedRequestActive(requestToken)) {
              setCurrentLocation(loc);
              setIsGpsLocation(true);
            }
          } catch (error) {
            const loc: Location = {
              id: Date.now(),
              name: "Current Location",
              latitude: lat,
              longitude: lon,
            };
            if (isTrackedRequestActive(requestToken)) {
              setCurrentLocation(loc);
              setIsGpsLocation(true);
            }
          }

          await fetchWeatherForCoords(lat, lon, "initial-load", {
            requestToken,
          });
          if (isTrackedRequestActive(requestToken)) {
            setLoadingPhase("idle");
          }
        },
        async () => {
          await applyLocationFallback();
        },
        {
          enableHighAccuracy: false,
          maximumAge: 15 * 60 * 1000,
          timeout: 15000,
        },
      );
    } else {
      await applyLocationFallback();
    }
  }, [
    beginTrackedRequest,
    fetchWeatherForCoords,
    isTrackedRequestActive,
  ]);

  // Initial load - try geolocation, fallback to first saved favorite or Milan
  useEffect(() => {
    void fetchInitialWeather();
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
      if (
        Date.now() - lastSuccessfulRefreshAtRef.current <
        REFRESH_INTERVAL_MS
      ) {
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

  const handleSelectCurrentLocation = useCallback(() => {
    setIsSearching(false);
    void fetchInitialWeather();
  }, [fetchInitialWeather]);

  const handleSelectLocation = async (location: Location) => {
    const requestToken = beginTrackedRequest();
    setIsSearching(false);
    setLoadingPhase("weather");

    const weather = await fetchWeatherForCoords(
      location.latitude,
      location.longitude,
      "location-select",
      { requestToken },
    );

    if (weather && isTrackedRequestActive(requestToken)) {
      setCurrentLocation(location);
      setIsGpsLocation(false);
    }

    if (isTrackedRequestActive(requestToken)) {
      setLoadingPhase("idle");
    }
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

  const toggleMinimal = useCallback(() => {
    mainRef.current?.scrollTo(0, 0);
    setIsMinimal((prev) => !prev);
  }, []);

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  const resetSwipeFeedback = useCallback(() => {
    void animate(swipeX, 0, {
      type: "spring",
      stiffness: 520,
      damping: 42,
    });
    void animate(swipeOpacity, 1, { duration: 0.16, ease: "easeOut" });
  }, [swipeOpacity, swipeX]);

  const playSwipeExit = useCallback(
    async (direction: "next" | "previous") => {
      const exitX =
        direction === "next" ? -SWIPE_EXIT_DISTANCE_PX : SWIPE_EXIT_DISTANCE_PX;

      await Promise.all([
        animate(swipeX, exitX, {
          duration: 0.18,
          ease: [0.22, 1, 0.36, 1],
        }).finished,
        animate(swipeOpacity, 0, {
          duration: 0.16,
          ease: "easeOut",
        }).finished,
      ]);
    },
    [swipeOpacity, swipeX],
  );

  const stageSwipeEntry = useCallback(
    (direction: "next" | "previous") => {
      const entryX =
        direction === "next" ? SWIPE_EXIT_DISTANCE_PX : -SWIPE_EXIT_DISTANCE_PX;

      swipeX.set(entryX);
      swipeOpacity.set(0);
    },
    [swipeOpacity, swipeX],
  );

  const handleSwipeNavigation = useCallback(
    async (direction: "next" | "previous") => {
      if (!currentLocation || loadingPhase !== "idle") {
        resetSwipeFeedback();
        return;
      }

      const isMobileViewport =
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
      if (!isMobileViewport) {
        resetSwipeFeedback();
        return;
      }

      const currentFavoriteIndex = favorites.findIndex((favorite) => {
        return (
          favorite.id === currentLocation.id ||
          (favorite.latitude === currentLocation.latitude &&
            favorite.longitude === currentLocation.longitude)
        );
      });

      if (direction === "next") {
        if (favorites.length === 0) {
          await playSwipeExit(direction);
          setIsSearching(true);
          resetSwipeFeedback();
          return;
        }

        if (currentFavoriteIndex < 0) {
          await playSwipeExit(direction);
          await handleSelectLocation(favorites[0]);
          stageSwipeEntry(direction);
          resetSwipeFeedback();
          return;
        }

        if (currentFavoriteIndex < favorites.length - 1) {
          await playSwipeExit(direction);
          await handleSelectLocation(favorites[currentFavoriteIndex + 1]);
          stageSwipeEntry(direction);
          resetSwipeFeedback();
          return;
        }

        await playSwipeExit(direction);
        setIsSearching(true);
        resetSwipeFeedback();
        return;
      }

      if (favorites.length === 0) {
        resetSwipeFeedback();
        return;
      }

      if (currentFavoriteIndex < 0) {
        resetSwipeFeedback();
        return;
      }

      if (currentFavoriteIndex > 0) {
        await playSwipeExit(direction);
        await handleSelectLocation(favorites[currentFavoriteIndex - 1]);
        stageSwipeEntry(direction);
        resetSwipeFeedback();
        return;
      }

      await playSwipeExit(direction);
      handleSelectCurrentLocation();
      stageSwipeEntry(direction);
      resetSwipeFeedback();
    },
    [
      currentLocation,
      favorites,
      handleSelectCurrentLocation,
      handleSelectLocation,
      loadingPhase,
      playSwipeExit,
      resetSwipeFeedback,
      stageSwipeEntry,
    ],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (isSearching) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [isSearching],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const touchStart = touchStartRef.current;
      if (!touchStart || isSearching) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      const resistedX = Math.max(
        -SWIPE_MAX_DRAG_PX,
        Math.min(SWIPE_MAX_DRAG_PX, deltaX * SWIPE_DRAG_RESISTANCE),
      );
      const opacity = Math.max(0.72, 1 - Math.abs(deltaX) / 360);

      swipeX.set(resistedX);
      swipeOpacity.set(opacity);
    },
    [isSearching, swipeOpacity, swipeX],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const touchStart = touchStartRef.current;
      touchStartRef.current = null;

      if (!touchStart || isSearching) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      if (
        Math.abs(deltaX) < SWIPE_MIN_DISTANCE_PX ||
        Math.abs(deltaY) > SWIPE_MAX_VERTICAL_DRIFT_PX ||
        Math.abs(deltaX) <= Math.abs(deltaY)
      ) {
        resetSwipeFeedback();
        return;
      }

      void handleSwipeNavigation(deltaX < 0 ? "next" : "previous");
    },
    [handleSwipeNavigation, isSearching, resetSwipeFeedback],
  );

  const displayLocation =
    currentLocation ??
    (loadingPhase === "location"
      ? {
          id: -1,
          name: "Current Location",
          latitude: FALLBACK_LOCATION.latitude,
          longitude: FALLBACK_LOCATION.longitude,
        }
      : FALLBACK_LOCATION);
  const activeWeatherCode = weatherData?.current.weatherCode ?? 0;
  const isForecastReady = Boolean(weatherData && currentLocation);
  const isFavorite = currentLocation
    ? favorites.some((f) => f.id === currentLocation.id)
    : false;
  const currentTime = new Date().toISOString(); // Approximate current time for hourly forecast

  return (
    <WeatherBackground
      weatherCode={activeWeatherCode}
      location={displayLocation}
      showImage={isForecastReady}
    >
      {!isMinimal && <InstallPrompt />}
      {/* Header */}
      <motion.header
        className="app-safe-header app-no-pull-refresh flex justify-between items-center gap-3 px-4 pb-4 text-white z-20 bg-linear-to-b from-mist-900 via-60 via-mist-900/70 to-mist-900/30 backdrop-blur-md shadow-lg ring ring-white/10"
        animate={{ y: isMinimal ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      >
        <div className="flex items-center min-w-0 flex-1">
          <div className="min-w-0 flex items-center gap-2">
            {(isGpsLocation || loadingPhase === "location") && (
              <MapPin className="w-5 h-5 shrink-0" />
            )}
            <h1 className="min-w-0">
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className="block truncate text-left text-2xl font-medium tracking-wide weather-hero-text cursor-pointer"
                title={displayLocation.name}
                aria-label="Open location search panel"
              >
                {displayLocation.name}
              </button>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isGpsLocation && isForecastReady && (
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
      </motion.header>

      {/* Main Content Scrollable Area */}
      <main
        ref={mainRef}
        className={`relative flex-1 min-h-0 z-10 flex flex-col scroll-touch${isMinimal ? " overflow-hidden" : " overflow-y-auto scrollbar-hide"}`}
      >
        <motion.div
          className="flex min-h-dvh flex-col"
          style={{ x: swipeX, opacity: swipeOpacity }}
        >
          {!isForecastReady ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="flex flex-col items-center gap-4 text-white">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="text-sm font-medium tracking-wide text-white/85">
                  {loadingPhase === "location"
                    ? "Loading location..."
                    : "Loading weather..."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className="flex flex-col h-full shrink-0"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="sticky top-0 z-20">
                  <motion.div
                    animate={{
                      opacity: isMinimal ? 0 : 1,
                      scale: isMinimal ? 0.3 : 1,
                      y: isMinimal ? -20 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8,
                    }}
                  >
                    <CurrentWeather weather={weatherData.current} />
                  </motion.div>
                </div>

                <div
                  className="flex-1 cursor-pointer"
                  onClick={toggleMinimal}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleMinimal();
                  }}
                  aria-label={
                    isMinimal
                      ? "Show full interface"
                      : "Hide interface to view image"
                  }
                />
              </div>

              <motion.div
                className="sticky bottom-0 z-20 shrink-0"
                animate={{ y: isMinimal ? "85%" : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                <HourlyForecast
                  hourly={weatherData.hourly}
                  currentTime={currentTime}
                />
              </motion.div>

              <motion.div
                className="flex flex-col shrink-0"
                animate={{ y: isMinimal ? "85%" : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                <DailyForecast
                  daily={weatherData.daily}
                  hourly={weatherData.hourly}
                  currentTime={currentTime}
                />

                {/* Footer */}
                <footer className="relative w-full px-3 pt-8 pb-3 text-white/90 drop-shadow-md text-xs mt-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0 pointer-events-none" />
                  <p className="relative z-10 font-medium text-center"></p>
                  <div className="relative z-10 mt-2 px-1">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <p>&copy; {new Date().getFullYear()} Coding Noodles</p>
                      <span className="text-white/35">//</span>
                      <a
                        href="/privacy/"
                        className="underline hover:text-white font-semibold transition-colors"
                      >
                        Privacy
                      </a>
                      <span className="text-white/35">//</span>
                      <a
                        href="/terms/"
                        className="underline hover:text-white font-semibold transition-colors"
                      >
                        Terms
                      </a>
                    </div>

                    <div className="mt-1 text-center">
                      Weather data provided by{" "}
                      <a
                        href="https://open-meteo.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white font-semibold transition-colors"
                      >
                        Open-Meteo
                      </a>
                    </div>
                  </div>
                </footer>
              </motion.div>
            </>
          )}
        </motion.div>
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
