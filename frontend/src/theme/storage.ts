import type { ThemePreference } from "../lib/contracts/settings";

const KEY = "app.theme.preference";

export function loadThemePreference(): ThemePreference {
  const v = localStorage.getItem(KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function saveThemePreference(pref: ThemePreference) {
  localStorage.setItem(KEY, pref);
}
