import { invoke } from "@tauri-apps/api/core";
import { NavKey } from "../components/layout/Sidebar";

export type ThemePreference = "system" | "light" | "dark";

export type Settings = {
  schemaVersion: number;
  themePreference: ThemePreference;
  gateway: { bindHost: string; port: number; autoStart: boolean };
  upstreamBaseUrl?: string | null;
  lastActiveProjectPath?: string | null;

  lastActiveView?: NavKey | null;
};

export async function settingsGet() {
  return invoke<Settings>("settings_get");
}

export async function settingsSetThemePreference(preference: ThemePreference) {
  return invoke<Settings>("settings_set_theme_preference", { preference });
}

export async function settingsSetGateway(bindHost: string, port: number) {
  return invoke<Settings>("settings_set_gateway", { bindHost, port });
}

export async function settingsSetLastActiveView(view: NavKey) {
  return invoke<Settings>("settings_set_last_active_view", { view });
}