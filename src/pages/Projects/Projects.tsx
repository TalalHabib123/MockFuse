import { useEffect, useMemo, useState } from "react";
import { gatewayGetState, gatewayStop, type GatewayState } from "../../core/gateway";
import {
  projectsArchiveActive,
  projectsCreate,
  projectsGetOverview,
  projectsRestore,
  type CreateProjectInput,
  type ProjectSummary,
  type ProjectsOverview,
} from "../../core/projects";

import ActiveProjectSection from "./sections/ActiveProjectPanel";
import ArchivedProjectsSection from "./sections/ArchivedProjectsPanel";
import CreateProjectView from "./views/CreateProjectView";
import ProjectDetailView from "./views/ProjectDetailView";

type Mode = "overview" | "create" | "detail";

export default function ProjectsPage() {
  const [mode, setMode] = useState<Mode>("overview");
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);

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

      // keep detail page data in sync if open
      if (selectedProject) {
        const merged = [ov.active, ...ov.archived].filter(Boolean) as ProjectSummary[];
        const next = merged.find((p) => p.id === selectedProject.id) ?? null;
        setSelectedProject(next);
      }
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

  const openProject = (project: ProjectSummary) => {
    setSelectedProject(project);
    setMode("detail");
  };

  const onArchiveActive = async () => {
    if (!data.active) return;

    const ok = confirm(
      gatewayState === "running"
        ? `Gateway is running. Stop it, then archive "${data.active.name}"?`
        : `Archive "${data.active.name}"?`
    );
    if (!ok) return;

    setLoading(true);
    try {
      if (gatewayState === "running") await gatewayStop();
      await projectsArchiveActive();
      await refresh();

      if (selectedProject?.id === data.active.id) {
        setSelectedProject(null);
        setMode("overview");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRestore = async (projectId: string, projectName: string) => {
    const ok = confirm(
      gatewayState === "running"
        ? `Gateway is running. Stop it, archive the current active project, and restore "${projectName}"?`
        : `Restore "${projectName}"? Current active project will be archived.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      if (gatewayState === "running") await gatewayStop();
      const restored = await projectsRestore(projectId);
      await refresh();

      setSelectedProject(restored);
      setMode("detail");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (input: CreateProjectInput) => {
    setLoading(true);
    try {
      if (input.replaceActive && gatewayState === "running") {
        await gatewayStop();
      }

      const created = await projectsCreate(input);
      await refresh();

      setSelectedProject(created);
      setMode("detail");
    } finally {
      setLoading(false);
    }
  };

  const topBar = useMemo(() => {
    if (mode === "detail" && selectedProject) return null;

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
  }, [mode, selectedProject]);

  return (
    <div className="max-w-full">
      {topBar}

      <div className={topBar ? "mt-5" : ""}>
        {mode === "create" ? (
          <CreateProjectView
            disabled={loading}
            activeProject={data.active}
            gatewayState={gatewayState}
            onCancel={() => setMode("overview")}
            onCreate={onCreate}
          />
        ) : mode === "detail" && selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            gatewayState={gatewayState}
            onBack={() => setMode("overview")}
          />
        ) : (
          <div className="grid gap-4">
            <ActiveProjectSection
              loading={loading}
              project={data.active}
              gatewayState={gatewayState}
              onRefresh={refresh}
              onArchive={onArchiveActive}
              onOpen={openProject}
            />

            <ArchivedProjectsSection
              loading={loading}
              projects={data.archived}
              onRestore={onRestore}
              onOpen={openProject}
            />
          </div>
        )}
      </div>
    </div>
  );
}