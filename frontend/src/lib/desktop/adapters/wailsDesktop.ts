import {
  ArchiveActiveProject,
  CreateProject,
  GetGatewayState,
  GetProjectsOverview,
  GetSettings,
  Health,
  OpenPath,
  RestoreProject,
  SetGatewaySettings,
  SetLastActiveView,
  SetThemePreference,
  StartGateway,
  StopGateway,
} from "../../../../wailsjs/go/main/App";
import { EventsOff, EventsOn } from "../../../../wailsjs/runtime/runtime";
import type { AppView } from "../../contracts/app";
import type {
  GatewayStateChangedEvent,
  SystemErrorEvent,
} from "../../contracts/events";
import type { GatewayState } from "../../contracts/gateway";
import type { CreateProjectInput, ProjectSummary, ProjectsOverview } from "../../contracts/projects";
import type {
  Settings,
  SetGatewaySettingsRequest,
  ThemePreference,
} from "../../contracts/settings";
import {
  DESKTOP_EVENT_GATEWAY_STATE_CHANGED,
  DESKTOP_EVENT_SYSTEM_ERROR,
} from "../events";
import type {
  DesktopAPIContract,
  DesktopEventsContract,
  DesktopUnsubscribe,
} from "../types";

type EventPayload = GatewayStateChangedEvent | SystemErrorEvent;
type EventListener = (payload: EventPayload) => void;

const listeners = new Map<string, Set<EventListener>>();
const boundEvents = new Set<string>();

function subscribe<T extends EventPayload>(
  eventName: string,
  listener: (payload: T) => void,
): DesktopUnsubscribe {
  const set = listeners.get(eventName) ?? new Set<EventListener>();
  listeners.set(eventName, set);
  set.add(listener as EventListener);

  if (!boundEvents.has(eventName)) {
    EventsOn(eventName, (payload: T) => {
      const currentListeners = listeners.get(eventName);
      if (!currentListeners) return;
      currentListeners.forEach((currentListener) => {
        currentListener(payload);
      });
    });
    boundEvents.add(eventName);
  }

  return () => {
    const currentListeners = listeners.get(eventName);
    if (!currentListeners) return;

    currentListeners.delete(listener as EventListener);
    if (currentListeners.size === 0) {
      listeners.delete(eventName);
      boundEvents.delete(eventName);
      EventsOff(eventName);
    }
  };
}

export const wailsDesktopAPI: DesktopAPIContract = {
  health() {
    return Health();
  },
  getSettings() {
    return GetSettings() as Promise<Settings>;
  },
  setThemePreference(preference: ThemePreference) {
    return SetThemePreference(preference) as Promise<Settings>;
  },
  setGatewaySettings(request: SetGatewaySettingsRequest) {
    return SetGatewaySettings(request) as Promise<Settings>;
  },
  setLastActiveView(view: AppView) {
    return SetLastActiveView(view) as Promise<Settings>;
  },
  getProjectsOverview() {
    return GetProjectsOverview() as Promise<ProjectsOverview>;
  },
  createProject(input: CreateProjectInput) {
    return CreateProject({
      ...input,
      replaceActive: input.replaceActive ?? false,
      upstreamBaseUrl: input.upstreamBaseUrl ?? undefined,
    }) as Promise<ProjectSummary>;
  },
  async archiveActiveProject() {
    await ArchiveActiveProject();
  },
  restoreProject(projectId: string) {
    return RestoreProject({ id: projectId }) as Promise<ProjectSummary>;
  },
  async getGatewayState() {
    const response = await GetGatewayState();
    return response.state as GatewayState;
  },
  async startGateway() {
    const response = await StartGateway();
    return response.state as GatewayState;
  },
  async stopGateway() {
    const response = await StopGateway();
    return response.state as GatewayState;
  },
  async openPath(path: string) {
    await OpenPath({ path });
  },
};

export const wailsDesktopEvents: DesktopEventsContract = {
  onGatewayStateChanged(listener) {
    return subscribe<GatewayStateChangedEvent>(
      DESKTOP_EVENT_GATEWAY_STATE_CHANGED,
      listener,
    );
  },
  onSystemError(listener) {
    return subscribe<SystemErrorEvent>(DESKTOP_EVENT_SYSTEM_ERROR, listener);
  },
};
