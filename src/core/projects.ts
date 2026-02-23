import { invoke } from "@tauri-apps/api/core";

export type ProjectSummary = {
  id: string;
  name: string;
  rootDir: string;
  updatedAt?: string | null;
  routesCount: number; // <— important for start/stop enablement
};

export type ProjectsOverview = {
  active: ProjectSummary | null;
  archived: ProjectSummary[];
};

export type CreateProjectInput = {
  name: string;
  bindHost: string;
  port: number;
  upstreamBaseUrl?: string | null;
  replaceActive?: boolean; // <— new
};

export async function projectsGetOverview() {
  return invoke<ProjectsOverview>("projects_get_overview");
}

export async function projectsCreate(input: CreateProjectInput) {
  return invoke<ProjectSummary>("projects_create_project", input);
}

export async function projectsArchiveActive() {
  return invoke<void>("projects_archive_active");
}

export async function projectsRestore(id: string) {
  return invoke<ProjectSummary>("projects_restore_project", { id });
}