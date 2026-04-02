import type { AppView } from "./app";

export type ThemePreference = "system" | "light" | "dark";

export type GatewaySettings = {
  bindHost: string;
  port: number;
  autoStart: boolean;
};

export type Settings = {
  schemaVersion: number;
  themePreference: ThemePreference;
  gateway: GatewaySettings;
  upstreamBaseUrl?: string | null;
  lastActiveProjectPath?: string | null;
  lastActiveView?: AppView | null;
};

export type SetGatewaySettingsRequest = {
  bindHost: string;
  port: number;
};
