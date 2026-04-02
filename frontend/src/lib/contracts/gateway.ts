export type GatewayState = "pending" | "running" | "stopped";

export type GatewayStateResponse = {
  state: GatewayState;
  projectId?: string;
};
