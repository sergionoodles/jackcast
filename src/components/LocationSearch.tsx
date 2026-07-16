import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  X,
  Trash2,
  Navigation,
  Sun,
  Moon,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CircleHelp,
  Check,
  Palette,
} from "lucide-react";
import { AVAILABLE_THEMES, type ThemeId } from "../config/themes";
import { getThemePreviewImageUrl } from "../config/backgrounds";
import { searchLocations } from "../services/weather";
import { Location, WeatherData } from "../types";

interface LocationSearchProps {
  favorites: Location[];
  currentLocation: Location | null;
  weatherByLocation: Record<string, WeatherData>;
  selectedTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  onSelect: (location: Location) => void;
  onSelectCurrentLocation: () => void;
  onRemove: (locationId: number) => void;
  onClose: () => void;
}

const getLocationCacheKey = (
  location: Pick<Location, "latitude" | "longitude">,
) => `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;

const getWeatherIcon = (code?: number, isDay = true) => {
  if (typeof code !== "number") {
    return <CircleHelp className="drawer-muted h-9 w-9" />;
  }
  if (code <= 1) {
    return isDay ? (
      <Sun className="drawer-weather-icon h-9 w-9 text-amber-300" />
    ) : (
      <Moon className="drawer-weather-icon h-9 w-9 text-sky-200" />
    );
  }
  if (code === 2) {
    return <Cloud className="drawer-weather-icon h-9 w-9 text-slate-200" />;
  }
  if (code === 3 || code === 45 || code === 48) {
    return <CloudFog className="drawer-weather-icon h-9 w-9 text-slate-300" />;
  }
  if (code >= 51 && code <= 57) {
    return (
      <CloudDrizzle className="drawer-weather-icon h-9 w-9 text-cyan-200" />
    );
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className="drawer-weather-icon h-9 w-9 text-sky-300" />;
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return (
      <CloudSnow className="drawer-weather-icon drawer-snow-icon h-9 w-9" />
    );
  }
  if (code >= 95) {
    return (
      <CloudLightning className="drawer-weather-icon h-9 w-9 text-yellow-200" />
    );
  }

  return <Sun className="drawer-weather-icon h-9 w-9 text-amber-300" />;
};

const LocationSearch: React.FC<LocationSearchProps> = ({
  favorites,
  currentLocation,
  weatherByLocation,
  selectedTheme,
  onThemeChange,
  onSelect,
  onSelectCurrentLocation,
  onRemove,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length > 0;

  useEffect(() => {
    if (!isSearchMode) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;

    const fetchResults = async () => {
      try {
        setIsSearching(true);
        const locations = await searchLocations(trimmedQuery);
        if (!isCancelled) {
          setResults(locations);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    };

    const debounce = setTimeout(fetchResults, 400);
    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
  }, [trimmedQuery, isSearchMode]);

  return (
    <motion.div
      className="location-backdrop fixed inset-0 z-50 backdrop-blur-sm flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="location-drawer backdrop-blur-2xl w-full max-w-md h-full shadow-2xl flex flex-col border-l"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="drawer-divider app-safe-header app-no-pull-refresh px-4 pb-3 flex items-center border-b shrink-0">
          <Search className="drawer-muted w-6 h-6 mr-3 shrink-0" />
          <input
            autoFocus={favorites.length === 0}
            type="text"
            placeholder="Search for a city..."
            className="drawer-search-input h-10 flex-1 bg-transparent border-none outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            type="button"
            aria-label="Close location search"
            className="drawer-action drawer-muted p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {!isSearchMode && (
            <div className="flex min-h-full flex-col gap-3">
              <button
                type="button"
                onClick={onSelectCurrentLocation}
                className="drawer-card w-full p-4 flex items-center shadow-sm border transition-colors mb-4"
              >
                <div className="drawer-card-icon p-2 mr-4">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="drawer-text font-medium text-lg">
                    Current Location
                  </h4>
                  <p className="drawer-muted text-sm">
                    Use your device&apos;s GPS
                  </p>
                </div>
              </button>

              {favorites.length === 0 ? (
                <div className="drawer-muted text-center mt-10">
                  <p className="text-lg">No saved locations yet.</p>
                  <p className="text-sm mt-2">
                    Search for a city and tap the heart icon to save it.
                  </p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  <AnimatePresence>
                    {favorites.map((location) => {
                      const weather =
                        weatherByLocation[getLocationCacheKey(location)];
                      const isSelected =
                        currentLocation?.id === location.id ||
                        (currentLocation?.latitude === location.latitude &&
                          currentLocation?.longitude === location.longitude);

                      return (
                        <motion.div
                          key={location.id}
                          className={`drawer-card group relative overflow-hidden border p-4 shadow-lg transition-colors ${
                            isSelected ? "drawer-card-selected" : ""
                          }`}
                          initial={{ opacity: 0, y: 18, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.94 }}
                          layout
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_58%)] opacity-80" />
                          <button
                            type="button"
                            className="relative flex w-full flex-col items-start text-left"
                            onClick={() => onSelect(location)}
                          >
                            <div className="drawer-card-icon mb-2 flex h-16 w-16 items-center justify-center">
                              {getWeatherIcon(
                                weather?.current.weatherCode,
                                weather?.current.isDay ?? true,
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="drawer-text truncate text-lg font-semibold">
                                {location.name}
                              </h4>
                              <p className="drawer-muted mt-1 line-clamp-2 text-sm leading-4">
                                {location.admin1 ? `${location.admin1}, ` : ""}
                                {location.country}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${location.name} from saved locations`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(location.id);
                            }}
                            className="drawer-action drawer-muted absolute right-2 top-2 rounded-full p-2 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}

              <section className="drawer-divider mt-auto border-t pt-3">
                <div className="mb-4 flex items-start gap-3 px-1">
                  <div className="theme-settings-icon rounded-full p-2">
                    <Palette className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="drawer-text text-base font-semibold">
                      Settings
                    </h2>
                    <p className="drawer-muted mt-0.5 text-sm">
                      Choose a theme for the app interface.
                    </p>
                  </div>
                </div>

                <div
                  className="grid grid-cols-3 gap-2.5"
                  role="radiogroup"
                  aria-label="App theme"
                >
                  {AVAILABLE_THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.id;
                    const previewImageUrl = getThemePreviewImageUrl(theme.id);

                    return (
                      <label
                        key={theme.id}
                        className={`theme-option relative flex w-full cursor-pointer flex-col gap-2 border p-2 text-left transition-all ${
                          isSelected ? "theme-option-selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="app-theme"
                          value={theme.id}
                          checked={isSelected}
                          onChange={() => onThemeChange(theme.id)}
                          className="sr-only"
                        />
                        <span
                          className="theme-preview relative aspect-[3/4] w-full overflow-hidden"
                          aria-hidden="true"
                        >
                          {previewImageUrl && (
                            <img
                              src={previewImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 w-full">
                          <span className="drawer-text block text-sm font-semibold leading-tight">
                            {theme.name}
                          </span>
                          <span className="drawer-muted mt-1 block text-xs leading-tight">
                            {theme.description}
                          </span>
                        </span>
                        <span
                          className={`theme-selection-indicator absolute right-3 top-3 flex h-6 w-6 items-center justify-center border transition-colors ${
                            isSelected
                              ? "theme-selection-check border-transparent"
                              : "text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {isSearchMode && isSearching && (
            <div className="drawer-muted text-center mt-10">Searching...</div>
          )}

          {isSearchMode && !isSearching && results.length === 0 && (
            <div className="drawer-muted text-center mt-10">
              <p className="text-lg">No locations found.</p>
            </div>
          )}

          {isSearchMode && !isSearching && results.length > 0 && (
            <AnimatePresence>
              {results.map((location) => (
                <motion.button
                  key={location.id}
                  type="button"
                  className="drawer-card w-full text-left p-4 flex items-center shadow-sm border transition-colors"
                  onClick={() => onSelect(location)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <div className="drawer-card-icon p-2 mr-4">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="drawer-text font-medium text-lg">
                      {location.name}
                    </h4>
                    <p className="drawer-muted text-sm">
                      {location.admin1 ? `${location.admin1}, ` : ""}
                      {location.country}
                    </p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationSearch;
