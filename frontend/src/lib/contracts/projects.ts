export type ProjectSummary = {
  id: string;
  name: string;
  rootDir: string;
  updatedAt?: string | null;
  routesCount: number;
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
  replaceActive?: boolean;
};

export type RestoreProjectRequest = {
  id: string;
};

export type OpenPathRequest = {
  path: string;
};
