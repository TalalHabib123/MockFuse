import { useEffect, useMemo, useState } from "react";
import type { GatewayState } from "../../lib/contracts/gateway";
import type {
  CreateProjectInput,
  ProjectSummary,
  ProjectsOverview,
} from "../../lib/contracts/projects";
import { DesktopAPI } from "../../lib/desktop/DesktopAPI";
import { DesktopEvents } from "../../lib/desktop/DesktopEvents";
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
      const [overview, state] = await Promise.all([
        DesktopAPI.getProjectsOverview(),
        DesktopAPI.getGatewayState(),
      ]);
      setData(overview);
      setGatewayState(state);

      if (selectedProject) {
        const merged = [overview.active, ...overview.archived].filter(Boolean) as ProjectSummary[];
        const nextProject = merged.find((project) => project.id === selectedProject.id) ?? null;
        setSelectedProject(nextProject);
      }
    } catch (error) {
      console.warn("[Projects] refresh failed", error);
      setGatewayState("stopped");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    return DesktopEvents.onGatewayStateChanged((event) => {
      setGatewayState(event.state);
    });
  }, []);

  const openProject = (project: ProjectSummary) => {
    setSelectedProject(project);
    setMode("detail");
  };

  const onArchiveActive = async () => {
    if (!data.active) return;

    const confirmed = confirm(
      gatewayState === "running"
        ? `Gateway is running. Stop it, then archive "${data.active.name}"?`
        : `Archive "${data.active.name}"?`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      if (gatewayState === "running") {
        await DesktopAPI.stopGateway();
      }

      await DesktopAPI.archiveActiveProject();
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
    const confirmed = confirm(
      gatewayState === "running"
        ? `Gateway is running. Stop it, archive the current active project, and restore "${projectName}"?`
        : `Restore "${projectName}"? Current active project will be archived.`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      if (gatewayState === "running") {
        await DesktopAPI.stopGateway();
      }

      const restoredProject = await DesktopAPI.restoreProject(projectId);
      await refresh();

      setSelectedProject(restoredProject);
      setMode("detail");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (input: CreateProjectInput) => {
    setLoading(true);
    try {
      if (input.replaceActive && gatewayState === "running") {
        await DesktopAPI.stopGateway();
      }

      const createdProject = await DesktopAPI.createProject(input);
      await refresh();

      setSelectedProject(createdProject);
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
          <h2 className="m-0 text-xl font-semibold">Projects</h2>
          <p className="mt-2 text-(--muted)">
            Manage the active project and restore archived ones.
          </p>
        </div>

        {mode === "overview" ? (
          <button
            type="button"
            className="h-10 rounded-xl bg-(--accent) px-4 text-(--accent-contrast) hover:brightness-105 focus:outline-none"
            onClick={() => setMode("create")}
          >
            Create Project
          </button>
        ) : (
          <button
            type="button"
            className="h-10 rounded-xl border border-(--border) bg-(--bg) px-4 hover:brightness-105 focus:outline-none"
            onClick={() => setMode("overview")}
          >
            Back
          </button>
        )}
      </div>
    );
  }, [mode, selectedProject]);

  const selectedProjectIsActive =
    !!selectedProject && !!data.active && selectedProject.id === data.active.id;

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
            isActiveProject={selectedProjectIsActive}
            onBack={() => setMode("overview")}
            onRefresh={refresh}
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
