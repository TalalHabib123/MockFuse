import { useEffect, useMemo, useState } from "react";
import { gatewayGetState, type GatewayState, gatewayStop } from "../../core/gateway";
import {
  projectsGetOverview,
  type ProjectsOverview,
  projectsCreate,
  type CreateProjectInput,
  projectsRestore,
} from "../../core/projects";

import ActiveProjectSection from "./sections/ActiveProjectPanel";
import ArchivedProjectsSection from "./sections/ArchivedProjectsPanel";
import CreateProjectView from "./views/CreateProjectView";

type Mode = "overview" | "create";

export default function ProjectsPage() {
  const [mode, setMode] = useState<Mode>("overview");
  const [loading, setLoading] = useState(true);
  const [gatewayState, setGatewayState] = useState<GatewayState>("pending");
  const [data, setData] = useState<ProjectsOverview>({ active: null, archived: [] });

  const refresh = async () => {
    setLoading(true);
    setGatewayState("pending");
    try {
      const [ov, gs] = await Promise.all([projectsGetOverview(), gatewayGetState()]);
      setData(ov);
      setGatewayState(gs);
    } catch (e) {
      console.warn("[Projects] refresh failed", e);
      setGatewayState("stopped");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onCreate = async (input: CreateProjectInput) => {
    setLoading(true);
    try {
      await projectsCreate(input);
      await refresh();
      setMode("overview");
    } finally {
      setLoading(false);
    }
  };

  const onRestore = async (projectId: string) => {
    const ok = confirm(
      gatewayState === "running"
        ? "Gateway is running. Stop it, then restore this archived project (current active will be archived)?"
        : "Restore this archived project (current active will be archived)?"
    );
    if (!ok) return;

    setLoading(true);
    try {
      if (gatewayState === "running") {
        await gatewayStop();
      }
      await projectsRestore(projectId);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const topBar = useMemo(() => {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold m-0">Projects</h2>
          <p className="mt-2 text-(--muted)">
            Manage the active project and restore archived ones.
          </p>
        </div>

        {mode === "overview" ? (
          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-(--accent) text-(--accent-contrast) hover:brightness-105 focus:outline-none"
            onClick={() => setMode("create")}
          >
            Create Project
          </button>
        ) : (
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-(--border) bg-(--bg) hover:brightness-105 focus:outline-none"
            onClick={() => setMode("overview")}
          >
            Back
          </button>
        )}
      </div>
    );
  }, [mode]);

  return (
    <div className="max-w-full">
      {topBar}

      <div className="mt-5">
        {mode === "create" ? (
          <CreateProjectView
            disabled={loading}
            activeProject={data.active}       // ✅ required for replace prompt
            gatewayState={gatewayState}       // ✅ required for stop-then-archive flow
            onCancel={() => setMode("overview")}
            onCreate={onCreate}
          />
        ) : (
          <div className="grid gap-4">
            <ActiveProjectSection
              loading={loading}
              project={data.active}
              gatewayState={gatewayState}
              onRefresh={refresh}
            />

            <ArchivedProjectsSection
              loading={loading}
              projects={data.archived}
              onRestore={onRestore}           // ✅ restore flow
            />
          </div>
        )}
      </div>
    </div>
  );
}