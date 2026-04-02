import type { GatewayState } from "../../../lib/contracts/gateway";
import type { ProjectSummary } from "../../../lib/contracts/projects";
import { DesktopAPI } from "../../../lib/desktop/DesktopAPI";
import { formatMeaningfulTime } from "../../../utils/time";
import { displayPath } from "../utils/path";

export default function ActiveProjectSection({
  loading,
  project,
  gatewayState,
  onRefresh,
  onArchive,
  onOpen,
}: {
  loading: boolean;
  project: ProjectSummary | null;
  gatewayState: GatewayState;
  onRefresh: () => Promise<void>;
  onArchive: () => Promise<void>;
  onOpen: (project: ProjectSummary) => void;
}) {
  const canStart =
    !!project && project.routesCount > 0 && gatewayState !== "pending";
  const isRunning = gatewayState === "running";

  const onStartStop = async () => {
    if (!project) return;
    if (isRunning) await DesktopAPI.stopGateway();
    else await DesktopAPI.startGateway();
    await onRefresh();
  };

  const onOpenFolder = async () => {
    if (!project) return;
    await DesktopAPI.openPath(project.rootDir);
  };

  return (
    <section className="rounded-2xl border border-(--border) bg-(--card) p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold flex items-center gap-2">
            Active Project <GatewayBadge state={gatewayState} />
          </div>
          <div className="mt-1 text-sm text-(--muted)">
            The project currently used by the gateway.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
            onClick={() => void onArchive()}
            disabled={!project || loading}
          >
            Archive
          </button>

          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
            onClick={onOpenFolder}
            disabled={!project || loading}
          >
            Open Folder
          </button>

          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-(--accent) text-(--accent-contrast) hover:brightness-105 focus:outline-none disabled:opacity-60"
            onClick={onStartStop}
            disabled={
              loading || !project || (!isRunning && !canStart) // start is disabled if no endpoints
            }
            title={
              !project
                ? "No active project"
                : !isRunning && project.routesCount === 0
                  ? "Add endpoints to enable Start"
                  : undefined
            }
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-(--muted)">Loading…</div>
        ) : project ? (
          <div className="relative rounded-xl border border-(--border) bg-(--bg) pt-3 p-4 items-center justify-between gap-3">
            {/* absolute, top-left timestamp — doesn't affect layout or capture pointer events */}
            <div className="absolute top-1.5 right-3 text-xs text-(--muted) whitespace-nowrap pointer-events-none z-10">
              {project.updatedAt ? `Updated ${formatMeaningfulTime(project.updatedAt)}` : "—"}
            </div>

            <div className="flex items-center justify-between gap-3 pt-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{project.name}</div>

                  <div
                    className="mt-1 text-sm text-(--muted) truncate"
                    title={project.rootDir}
                  >
                    {displayPath(project.rootDir)}
                  </div>

                  <div className="mt-2 text-xs text-(--muted)">
                    Endpoints:{" "}
                    <span className="font-medium">{project.routesCount}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="h-10 px-4 mt-2 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
                disabled={!project || loading}
                onClick={() => {
                  if (project) onOpen(project);
                }}
                title={!project ? "No active project" : "Open project"}
              >
                Open
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-(--border) bg-(--bg) p-4">
            <div className="font-medium">No active project</div>
            <div className="mt-1 text-sm text-(--muted)">
              Create or restore a project to start routing requests.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function GatewayBadge({ state }: { state: GatewayState }) {
  const label =
    state === "running"
      ? "Running"
      : state === "pending"
        ? "Pending"
        : "Stopped";
  return (
    <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-(--border) bg-(--bg)">
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
      <span
        className={state === "running" ? "text-(--accent)" : "text-(--muted)"}
      >
        {label}
      </span>
    </span>
  );
}
