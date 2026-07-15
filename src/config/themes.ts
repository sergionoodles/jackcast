export type ThemeId = "jack-russell" | "samurai-zen" | "nothing-os";

export interface AppTheme {
  id: ThemeId;
  name: string;
  description: string;
  className: string;
  previewClassName: string;
  backgroundSet: string;
  fallbackBackground: string;
  themeColor: string;
}

export const DEFAULT_THEME_ID: ThemeId = "jack-russell";
export const THEME_STORAGE_KEY = "jackcastTheme";

export const THEMES: readonly AppTheme[] = [
  {
    id: "jack-russell",
    name: "Jack Russells",
    description: "Dreamy watercolor adventures",
    className: "theme-jack-russell",
    previewClassName: "theme-preview-jack-russell",
    backgroundSet: "jack-russell",
    fallbackBackground:
      "/backgrounds/jack-russell/clear-afternoon-1.jpeg",
    themeColor: "#161b1d",
  },
  {
    id: "samurai-zen",
    name: "Samurai Zen",
    description: "Ink, vermilion, and quiet skies",
    className: "theme-samurai-zen",
    previewClassName: "theme-preview-samurai-zen",
    backgroundSet: "samurai-zen",
    fallbackBackground: "/backgrounds/samurai-zen/default.svg",
    themeColor: "#171512",
  },
  {
    id: "nothing-os",
    name: "Nothing OS",
    description: "Monochrome dots with a red signal",
    className: "theme-nothing-os",
    previewClassName: "theme-preview-nothing-os",
    backgroundSet: "nothing-os",
    fallbackBackground: "/backgrounds/nothing-os/default.svg",
    themeColor: "#080808",
  },
];

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getTheme(themeId: ThemeId): AppTheme {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}
