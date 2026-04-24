import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, X, Trash2, Navigation } from "lucide-react";
import { searchLocations } from "../services/weather";
import { Location } from "../types";

interface LocationSearchProps {
  favorites: Location[];
  onSelect: (location: Location) => void;
  onSelectCurrentLocation: () => void;
  onRemove: (locationId: number) => void;
  onClose: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  favorites,
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
      className="fixed inset-0 z-50 bg-mist-900/40 backdrop-blur-sm flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-mist-900/60 backdrop-blur-2xl w-full max-w-md h-full shadow-2xl flex flex-col border-l border-white/10"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="p-6 flex items-center border-b border-white/10 shrink-0">
          <Search className="w-7 h-7 text-white/50 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search for a city..."
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-white/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            type="button"
            aria-label="Close location search"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {!isSearchMode && (
            <>
              <button
                type="button"
                onClick={onSelectCurrentLocation}
                className="w-full bg-white/10 rounded-2xl p-4 flex items-center shadow-sm border border-white/10 hover:bg-white/20 transition-colors mb-4"
              >
                <div className="bg-white/20 p-2 rounded-full mr-4 text-white">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-white font-medium text-lg">
                    Current Location
                  </h4>
                  <p className="text-white/60 text-sm">
                    Use your device&apos;s GPS
                  </p>
                </div>
              </button>

              {favorites.length === 0 ? (
                <div className="text-center text-white/50 mt-10">
                  <p className="text-lg">No saved locations yet.</p>
                  <p className="text-sm mt-2">
                    Search for a city and tap the heart icon to save it.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {favorites.map((location) => (
                    <motion.div
                      key={location.id}
                      className="bg-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-white/10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => onSelect(location)}
                      >
                        <h4 className="text-white font-medium text-lg">
                          {location.name}
                        </h4>
                        <p className="text-white/60 text-sm">
                          {location.admin1 ? `${location.admin1}, ` : ""}
                          {location.country}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(location.id);
                        }}
                        className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors ml-4"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </>
          )}

          {isSearchMode && isSearching && (
            <div className="text-center text-white/50 mt-10">Searching...</div>
          )}

          {isSearchMode && !isSearching && results.length === 0 && (
            <div className="text-center text-white/50 mt-10">
              <p className="text-lg">No locations found.</p>
            </div>
          )}

          {isSearchMode && !isSearching && results.length > 0 && (
            <AnimatePresence>
              {results.map((location) => (
                <motion.button
                  key={location.id}
                  type="button"
                  className="w-full text-left p-4 flex items-center bg-white/5 rounded-2xl shadow-sm border border-white/10 hover:bg-white/10 transition-colors"
                  onClick={() => onSelect(location)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <div className="bg-white/10 p-2 rounded-full mr-4">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">
                      {location.name}
                    </h4>
                    <p className="text-white/60 text-sm">
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
