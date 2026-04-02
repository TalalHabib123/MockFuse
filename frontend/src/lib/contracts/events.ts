import type { GatewayState } from "./gateway";

export type GatewayStateChangedEvent = {
  state: GatewayState;
  projectId?: string;
};

export type SystemErrorEvent = {
  code: string;
  message: string;
};
