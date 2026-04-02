package contracts

type ProjectSummary struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	RootDir     string  `json:"rootDir"`
	UpdatedAt   *string `json:"updatedAt"`
	RoutesCount uint32  `json:"routesCount"`
}

type ProjectsOverview struct {
	Active   *ProjectSummary  `json:"active"`
	Archived []ProjectSummary `json:"archived"`
}

type CreateProjectInput struct {
	Name            string  `json:"name"`
	BindHost        string  `json:"bindHost"`
	Port            uint16  `json:"port"`
	UpstreamBaseURL *string `json:"upstreamBaseUrl"`
	ReplaceActive   bool    `json:"replaceActive"`
}

type RestoreProjectRequest struct {
	ID string `json:"id"`
}

type OpenPathRequest struct {
	Path string `json:"path"`
}

type RuntimeTarget struct {
	ProjectID string
	Gateway   GatewaySettings
}
