import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, X } from "lucide-react";
import { searchLocations } from "../services/weather";
import { Location } from "../types";

interface LocationSearchProps {
  onSelect: (location: Location) => void;
  onClose: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 2) {
        setIsSearching(true);
        const locations = await searchLocations(query);
        setResults(locations);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    };

    const debounce = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounce);
  }, [query]);

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
          <Search className="w-6 h-6 text-white/50 mr-3" />
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
          {isSearching && (
            <div className="text-center text-white/50 mt-10">Searching...</div>
          )}

          {!isSearching && results.length === 0 && query.length > 2 && (
            <div className="text-center text-white/50 mt-10">
              <p className="text-lg">No locations found.</p>
            </div>
          )}

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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationSearch;
