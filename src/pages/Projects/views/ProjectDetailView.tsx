import type { ProjectSummary } from "../../../core/projects";
import type { GatewayState } from "../../../core/gateway";
import { formatMeaningfulTime } from "../../../utils/time";

function shortPath(full: string) {
  const n = (full ?? "").replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = n.split("/").filter(Boolean);
  if (parts.length <= 2) return parts.join("/");
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

export default function ProjectDetailView({
  project,
  gatewayState,
  onBack,
}: {
  project: ProjectSummary;
  gatewayState: GatewayState;
  onBack: () => void;
}) {
  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="h-9 px-3 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
          >
            Back
          </button>

          <h2 className="mt-4 text-xl font-semibold m-0">{project.name}</h2>
          <p className="mt-2 text-(--muted)">
            Project overview, gateway state, and configuration summary.
          </p>
        </div>

        <GatewayBadge state={gatewayState} />
      </div>

      <div className="mt-5 grid gap-4">
        {/* Overview */}
        <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
          <div className="font-semibold">Overview</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoBlock label="Project Name" value={project.name} />
            <InfoBlock label="Relative Path" value={shortPath(project.rootDir)} />
            <InfoBlock label="Endpoints" value={String(project.routesCount)} />
            <InfoBlock label="Last Updated" value={formatMeaningfulTime(project.updatedAt) ?? "—"} />
          </div>

          <div className="mt-4 rounded-xl border border-(--border) bg-(--bg) p-3">
            <div className="text-sm text-(--muted)">Full path</div>
            <div className="mt-1 break-all text-sm">{project.rootDir}</div>
          </div>
        </section>

        {/* Gateway / Runtime */}
        <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
          <div className="font-semibold">Gateway</div>
          <div className="mt-1 text-sm text-(--muted)">
            Current runtime state for this project.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-(--accent) text-(--accent-contrast) hover:brightness-105 focus:outline-none disabled:opacity-60"
              disabled={project.routesCount === 0 || gatewayState === "running"}
              onClick={() => console.log("Start project gateway (next)", project.id)}
            >
              Start
            </button>

            <button
              type="button"
              className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none disabled:opacity-60"
              disabled={gatewayState !== "running"}
              onClick={() => console.log("Stop project gateway (next)", project.id)}
            >
              Stop
            </button>

            <button
              type="button"
              className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
              onClick={() => console.log("Open folder (next)", project.id)}
            >
              Open Folder
            </button>
          </div>

          {project.routesCount === 0 && (
            <div className="mt-3 text-sm text-(--muted)">
              Add at least one endpoint before starting the gateway.
            </div>
          )}
        </section>

        {/* Placeholder sections for future implementation */}
        <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
          <div className="font-semibold">Routes & Configuration</div>
          <div className="mt-1 text-sm text-(--muted)">
            This section will show the YAML-backed route definitions, bind host, port, upstream base URL, and service settings.
          </div>

          <div className="mt-4 rounded-xl border border-(--border) bg-(--bg) p-4 text-(--muted)">
            No detailed configuration loaded yet.
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--bg) p-3">
      <div className="text-sm text-(--muted)">{label}</div>
      <div className="mt-1 font-medium break-all">{value}</div>
    </div>
  );
}

function GatewayBadge({ state }: { state: GatewayState }) {
  const label =
    state === "running" ? "Running" : state === "pending" ? "Pending" : "Stopped";

  return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-(--border) bg-(--bg)">
      <span
        className={[
          "w-2 h-2 rounded-full",
          state === "running"
            ? "bg-(--accent)"
            : state === "pending"
            ? "bg-(--muted)"
            : "bg-(--border)",
        ].join(" ")}
        aria-hidden="true"
      />
      <span className={state === "running" ? "text-(--accent)" : "text-(--muted)"}>
        {label}
      </span>
    </span>
  );
}