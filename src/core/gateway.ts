import { invoke } from "@tauri-apps/api/core";

export type GatewayState = "pending" | "running" | "stopped";

function normalize(v: unknown): GatewayState {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("run")) return "running";
  if (s.includes("start") || s.includes("pend")) return "pending";
  return "stopped";
}

export async function gatewayGetState(): Promise<GatewayState> {
  // preferred (additive command we can add)
  try {
    const r: any = await invoke("gateway_get_state");
    if (typeof r === "string") return normalize(r);
    if (r?.state) return normalize(r.state);
    if (typeof r?.running === "boolean") return r.running ? "running" : "stopped";
  } catch {}

  // fallback to whatever you already had
  try {
    const r: any = await invoke("gateway_status");
    if (typeof r === "string") return normalize(r);
    if (r?.state) return normalize(r.state);
    if (typeof r?.running === "boolean") return r.running ? "running" : "stopped";
  } catch {}

  return "stopped";
}

export async function gatewayStart() {
  // adjust name if your command differs
  await invoke("gateway_start");
}

export async function gatewayStop() {
  // adjust name if your command differs
  await invoke("gateway_stop");
}