import React from "react";
import { motion } from "motion/react";
import {
  Check,
  Clock3,
  Github,
  Palette,
  Ruler,
  Settings,
  X,
} from "lucide-react";
import { getThemePreviewImageUrl } from "../config/backgrounds";
import type { ClockFormat, UnitSystem } from "../config/preferences";
import { AVAILABLE_THEMES, type ThemeId } from "../config/themes";

interface SettingsDrawerProps {
  selectedTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  selectedUnitSystem: UnitSystem;
  onUnitSystemChange: (unitSystem: UnitSystem) => void;
  selectedClockFormat: ClockFormat;
  onClockFormatChange: (clockFormat: ClockFormat) => void;
  onClose: () => void;
}

const UNIT_OPTIONS: readonly {
  id: UnitSystem;
  label: string;
  description: string;
}[] = [
  { id: "metric", label: "Metric", description: "°C · km/h" },
  { id: "us", label: "US", description: "°F · mph" },
];

const CLOCK_OPTIONS: readonly {
  id: ClockFormat;
  label: string;
  description: string;
}[] = [
  { id: "12h", label: "12-hour", description: "1:30 PM" },
  { id: "24h", label: "24-hour", description: "13:30" },
];

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  selectedTheme,
  onThemeChange,
  selectedUnitSystem,
  onUnitSystemChange,
  selectedClockFormat,
  onClockFormatChange,
  onClose,
}) => (
  <motion.div
    className="location-backdrop fixed inset-0 z-50 flex justify-end backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-label="App settings"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      className="location-drawer flex h-full w-full max-w-md flex-col border-l shadow-2xl backdrop-blur-2xl"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="drawer-divider app-safe-header app-no-pull-refresh flex shrink-0 items-center border-b px-4 pb-3.5">
        <div className="theme-settings-icon mr-3 rounded-full p-2">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="drawer-text text-lg font-semibold">Settings</h2>
          <p className="drawer-muted text-xs">Units, time, and themes</p>
        </div>
        <button
          autoFocus
          onClick={onClose}
          type="button"
          aria-label="Close settings"
          className="drawer-action drawer-muted rounded-full p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-hide">
        <fieldset>
          <legend className="drawer-text mb-2 flex items-center gap-2 text-base font-semibold">
            <Ruler className="h-4 w-4" aria-hidden="true" />
            Units
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {UNIT_OPTIONS.map((option) => {
              const isSelected = selectedUnitSystem === option.id;
              return (
                <label
                  key={option.id}
                  className={`preference-option relative flex cursor-pointer items-center border px-3 py-2.5 transition-all ${
                    isSelected ? "preference-option-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="unit-system"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onUnitSystemChange(option.id)}
                    className="sr-only"
                  />
                  <span>
                    <span className="drawer-text block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="drawer-muted mt-0.5 block text-xs">
                      {option.description}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className="preference-check ml-auto h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="drawer-text mb-2 flex items-center gap-2 text-base font-semibold">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Clock
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {CLOCK_OPTIONS.map((option) => {
              const isSelected = selectedClockFormat === option.id;
              return (
                <label
                  key={option.id}
                  className={`preference-option relative flex cursor-pointer items-center border px-3 py-2.5 transition-all ${
                    isSelected ? "preference-option-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="clock-format"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onClockFormatChange(option.id)}
                    className="sr-only"
                  />
                  <span>
                    <span className="drawer-text block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="drawer-muted mt-0.5 block text-xs">
                      {option.description}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className="preference-check ml-auto h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="drawer-text mb-2 flex items-center gap-2 text-base font-semibold">
            <Palette className="h-4 w-4" aria-hidden="true" />
            Theme
          </legend>
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
                  className={`theme-option relative flex w-full cursor-pointer flex-col gap-1.5 border px-1 pb-1.5 pt-1 text-left transition-all ${
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
                  <span className="w-full min-w-0 px-1">
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
        </fieldset>
      </div>

      <footer className="drawer-divider drawer-footer shrink-0 border-t px-4 pt-3 text-sm">
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="App links"
        >
          <a
            href="/privacy/"
            className="drawer-muted transition-colors hover:underline"
          >
            Privacy
          </a>
          <span className="drawer-muted opacity-40" aria-hidden="true">
            /
          </span>
          <a
            href="/terms/"
            className="drawer-muted transition-colors hover:underline"
          >
            Terms
          </a>
          <span className="drawer-muted opacity-40" aria-hidden="true">
            /
          </span>
          <a
            href="https://github.com/sergionoodles/jackcast"
            target="_blank"
            rel="noreferrer"
            className="drawer-muted inline-flex items-center gap-1.5 transition-colors hover:underline"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
        </nav>
      </footer>
    </motion.aside>
  </motion.div>
);

export default SettingsDrawer;
