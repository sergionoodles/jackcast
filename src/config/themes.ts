export type ThemeId =
  | "jack-russell"
  | "samurai-zen"
  | "nothing-os"
  | "arcade-fighter"
  | "pocket-clay"
  | "nordic-paper";

export interface AppTheme {
  id: ThemeId;
  name: string;
  description: string;
  className: string;
  backgroundSet: string;
  themeColor: string;
  isBeta?: boolean;
}

export const DEFAULT_THEME_ID: ThemeId = "jack-russell";
export const THEME_STORAGE_KEY = "jackcastTheme";

export const THEMES: readonly AppTheme[] = [
  {
    id: "jack-russell",
    name: "Jack Russells",
    description: "Dreamy watercolor adventures",
    className: "theme-jack-russell",
    backgroundSet: "jack-russell",
    themeColor: "#161b1d",
  },
  {
    id: "samurai-zen",
    name: "Samurai Zen",
    description: "Ink, vermilion, and quiet skies",
    className: "theme-samurai-zen",
    backgroundSet: "samurai-zen",
    themeColor: "#171512",
  },
  {
    id: "nothing-os",
    name: "Nothing OS",
    description: "Monochrome dots with a red signal",
    className: "theme-nothing-os",
    backgroundSet: "nothing-os",
    themeColor: "#080808",
  },
  {
    id: "arcade-fighter",
    name: "Arcade Fighter",
    description: "Every forecast is the next round",
    className: "theme-arcade-fighter",
    backgroundSet: "arcade-fighter",
    themeColor: "#090b17",
    isBeta: true,
  },
  {
    id: "pocket-clay",
    name: "Pocket Clay",
    description: "Tiny handcrafted weather worlds",
    className: "theme-pocket-clay",
    backgroundSet: "pocket-clay",
    themeColor: "#354c47",
    isBeta: true,
  },
  {
    id: "nordic-paper",
    name: "Nordic Paper",
    description: "Layered landscapes in quiet color",
    className: "theme-nordic-paper",
    backgroundSet: "nordic-paper",
    themeColor: "#203a52",
    isBeta: true,
  },
];

export const AVAILABLE_THEMES = THEMES.filter(
  (theme) => !theme.isBeta || import.meta.env.DEV,
);

export function isThemeId(value: string | null): value is ThemeId {
  return AVAILABLE_THEMES.some((theme) => theme.id === value);
}

export function getTheme(themeId: ThemeId): AppTheme {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}
