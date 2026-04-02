import type { AppView } from "../contracts/app";
import type { SystemErrorEvent, GatewayStateChangedEvent } from "../contracts/events";
import type { GatewayState } from "../contracts/gateway";
import type {
  CreateProjectInput,
  ProjectSummary,
  ProjectsOverview,
} from "../contracts/projects";
import type {
  Settings,
  SetGatewaySettingsRequest,
  ThemePreference,
} from "../contracts/settings";

export type DesktopUnsubscribe = () => void;

export interface DesktopAPIContract {
  health(): Promise<{ status: string }>;
  getSettings(): Promise<Settings>;
  setThemePreference(preference: ThemePreference): Promise<Settings>;
  setGatewaySettings(request: SetGatewaySettingsRequest): Promise<Settings>;
  setLastActiveView(view: AppView): Promise<Settings>;
  getProjectsOverview(): Promise<ProjectsOverview>;
  createProject(input: CreateProjectInput): Promise<ProjectSummary>;
  archiveActiveProject(): Promise<void>;
  restoreProject(projectId: string): Promise<ProjectSummary>;
  getGatewayState(): Promise<GatewayState>;
  startGateway(): Promise<GatewayState>;
  stopGateway(): Promise<GatewayState>;
  openPath(path: string): Promise<void>;
}

export interface DesktopEventsContract {
  onGatewayStateChanged(
    listener: (event: GatewayStateChangedEvent) => void,
  ): DesktopUnsubscribe;
  onSystemError(listener: (event: SystemErrorEvent) => void): DesktopUnsubscribe;
}
