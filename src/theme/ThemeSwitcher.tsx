import { useTheme } from "./useTheme";
import type { ThemePreference } from "./types";
import { settingsSetThemePreference } from "../core/settings";

export function ThemeSwitcher() {
  const { preference, resolved, setPreference } = useTheme();

  const options: ThemePreference[] = ["system", "light", "dark"];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ opacity: 0.8 }}>Theme:</span>
      <select
        value={preference}
        onChange={async (e) => {
          const newPreference = e.target.value as ThemePreference;
          await settingsSetThemePreference(newPreference);
          setPreference(newPreference);
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span style={{ opacity: 0.7 }}>(resolved: {resolved})</span>
    </div>
  );
}
