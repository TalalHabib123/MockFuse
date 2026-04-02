import { useTheme } from "./useTheme";
import type { ThemePreference } from "./types";

export function ThemeSwitcher() {
  const { preference, resolved, setPreference } = useTheme();

  const options: ThemePreference[] = ["system", "light", "dark"];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-(--muted)">Theme</span>
      <select
        className="h-10 rounded-xl border border-(--border) bg-(--bg) px-3 outline-none"
        value={preference}
        onChange={(event) => {
          const nextPreference = event.target.value as ThemePreference;
          setPreference(nextPreference);
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-(--muted)">Resolved: {resolved}</span>
    </div>
  );
}
