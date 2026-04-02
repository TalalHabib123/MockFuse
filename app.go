package main

import (
	"context"
	"fmt"

	internalapp "mockfuse/internal/app"
	"mockfuse/internal/contracts"
)

type App struct {
	ctx  context.Context
	deps *internalapp.Dependencies
}

func NewApp(deps *internalapp.Dependencies) *App {
	return &App{
		deps: deps,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.deps.AttachContext(ctx)
}

func (a *App) shutdown(ctx context.Context) {
	a.deps.Gateway.Shutdown()
}

func (a *App) Health() contracts.HealthResponse {
	return contracts.HealthResponse{Status: "ok"}
}

func (a *App) GetSettings() (contracts.Settings, error) {
	return a.deps.Settings.Get()
}

func (a *App) SetThemePreference(preference contracts.ThemePreference) (contracts.Settings, error) {
	settings, err := a.deps.Settings.SetThemePreference(preference)
	if err != nil {
		return contracts.Settings{}, a.fail("settings.theme_preference", err)
	}
	return settings, nil
}

func (a *App) SetGatewaySettings(request contracts.SetGatewaySettingsRequest) (contracts.Settings, error) {
	settings, err := a.deps.Settings.SetGateway(request)
	if err != nil {
		return contracts.Settings{}, a.fail("settings.gateway", err)
	}
	return settings, nil
}

func (a *App) SetLastActiveView(view contracts.AppView) (contracts.Settings, error) {
	settings, err := a.deps.Settings.SetLastActiveView(view)
	if err != nil {
		return contracts.Settings{}, a.fail("settings.last_active_view", err)
	}
	return settings, nil
}

func (a *App) GetProjectsOverview() (contracts.ProjectsOverview, error) {
	return a.deps.Projects.Overview()
}

func (a *App) CreateProject(input contracts.CreateProjectInput) (contracts.ProjectSummary, error) {
	project, err := a.deps.Projects.CreateProject(input)
	if err != nil {
		return contracts.ProjectSummary{}, a.fail("projects.create", err)
	}
	return project, nil
}

func (a *App) ArchiveActiveProject() error {
	if err := a.deps.Projects.ArchiveActive(); err != nil {
		return a.fail("projects.archive_active", err)
	}
	return nil
}

func (a *App) RestoreProject(request contracts.RestoreProjectRequest) (contracts.ProjectSummary, error) {
	project, err := a.deps.Projects.RestoreProject(request.ID)
	if err != nil {
		return contracts.ProjectSummary{}, a.fail("projects.restore", err)
	}
	return project, nil
}

func (a *App) GetGatewayState() contracts.GatewayStateResponse {
	return a.deps.Gateway.State()
}

func (a *App) StartGateway() (contracts.GatewayStateResponse, error) {
	active, err := a.deps.Projects.ActiveRuntimeTarget()
	if err != nil {
		return contracts.GatewayStateResponse{}, a.fail("gateway.start", err)
	}

	response, err := a.deps.Gateway.Start(active)
	if err != nil {
		return contracts.GatewayStateResponse{}, a.fail("gateway.start", err)
	}
	return response, nil
}

func (a *App) StopGateway() (contracts.GatewayStateResponse, error) {
	response, err := a.deps.Gateway.Stop()
	if err != nil {
		return contracts.GatewayStateResponse{}, a.fail("gateway.stop", err)
	}
	return response, nil
}

func (a *App) OpenPath(request contracts.OpenPathRequest) error {
	if err := a.deps.Opener.Open(request.Path); err != nil {
		return a.fail("platform.open_path", err)
	}
	return nil
}

func (a *App) fail(code string, err error) error {
	if err == nil {
		return nil
	}

	a.deps.EmitSystemError(code, err.Error())
	return fmt.Errorf("%s: %w", code, err)
}
