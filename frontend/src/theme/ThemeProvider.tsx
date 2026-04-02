import React, { createContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { DesktopAPI } from "../lib/desktop/DesktopAPI";
import { loadThemePreference, saveThemePreference } from "./storage";
import type { ResolvedTheme, ThemePreference } from "./types";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
const settingsSetThemePreference = DesktopAPI.setThemePreference;

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? getSystemTheme() : pref;
}

function applyThemeToDocument(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1) Instant startup from localStorage cache (prevents flicker)
  const [preference, setPreferenceState] = useState<ThemePreference>(() => loadThemePreference());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(loadThemePreference()));

  // 2) Apply theme before paint
  useLayoutEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyThemeToDocument(next);
  }, [preference]);

  // 3) On app start: load persisted settings from the desktop backend and sync
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await DesktopAPI.getSettings();
        const persisted = settings.themePreference;
        if (cancelled) return;

        // Update state + refresh local cache for next startup
        setPreferenceState(persisted);
        saveThemePreference(persisted);
      } catch (e) {
        console.warn("[Theme] getSettings failed, using cached theme.", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 4) Track OS changes when preference=system
  useEffect(() => {
    if (preference !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = getSystemTheme();
      setResolved(next);
      applyThemeToDocument(next);
    };

    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [preference]);

  // 5) When user changes preference: update UI immediately + persist to Rust
  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    saveThemePreference(pref); // cache for instant boot next time

    void settingsSetThemePreference(pref).catch((e) => {
      console.error("[Theme] failed to persist theme preference", e);
      // Optional: revert state on failure (I’d skip revert in v1)
    });
  };

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
