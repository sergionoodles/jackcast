import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Trash2, Navigation } from 'lucide-react';
import { Location } from '../types';

interface FavoritesDrawerProps {
  favorites: Location[];
  onSelect: (location: Location) => void;
  onSelectCurrentLocation: () => void;
  onRemove: (locationId: number) => void;
  onClose: () => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ favorites, onSelect, onSelectCurrentLocation, onRemove, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-mist-900/40 backdrop-blur-sm flex justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-mist-900/60 backdrop-blur-2xl w-full max-w-md h-full shadow-2xl flex flex-col border-r border-white/10"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-white/80" />
            Saved Locations
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-white/80" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {/* Current Location Button */}
          <button
            onClick={onSelectCurrentLocation}
            className="w-full bg-white/10 rounded-2xl p-4 flex items-center shadow-sm border border-white/10 hover:bg-white/20 transition-colors mb-4"
          >
            <div className="bg-white/20 p-2 rounded-full mr-4 text-white">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-white font-medium text-lg">Current Location</h4>
              <p className="text-white/60 text-sm">Use your device's GPS</p>
            </div>
          </button>

          {favorites.length === 0 ? (
            <div className="text-center text-white/50 mt-10">
              <p className="text-lg">No saved locations yet.</p>
              <p className="text-sm mt-2">Search for a city and tap the heart icon to save it.</p>
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
                    className="flex-1 text-left"
                    onClick={() => onSelect(location)}
                  >
                    <h4 className="text-white font-medium text-lg">{location.name}</h4>
                    <p className="text-white/60 text-sm">
                      {location.admin1 ? `${location.admin1}, ` : ''}{location.country}
                    </p>
                  </button>
                  <button
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FavoritesDrawer;
