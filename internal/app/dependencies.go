package app

import (
	"context"
	"log"

	"mockfuse/internal/config"
	"mockfuse/internal/contracts"
	"mockfuse/internal/events"
	"mockfuse/internal/gateway"
	"mockfuse/internal/platform"
	"mockfuse/internal/projects"
	"mockfuse/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Dependencies struct {
	Paths    storage.Paths
	Settings *config.Store
	Projects *projects.Store
	Gateway  *gateway.Service
	Opener   *platform.Opener

	emitter *WailsEmitter
}

func NewDependencies() (*Dependencies, error) {
	paths, migration, err := storage.PrepareAppData("MockFuse", "com.mockfuse.app")
	if err != nil {
		return nil, err
	}

	settingsStore, err := config.NewStore(paths.SettingsPath)
	if err != nil {
		return nil, err
	}

	projectsStore, err := projects.NewStore(paths.ProjectsPath, paths.ProjectsDir)
	if err != nil {
		return nil, err
	}

	deps := &Dependencies{
		Paths:    paths,
		Settings: settingsStore,
		Projects: projectsStore,
		Gateway:  gateway.NewService(),
		Opener:   platform.NewOpener(),
		emitter:  &WailsEmitter{},
	}

	deps.Gateway.SetEmitter(deps.emitter)
	logMigration(migration)

	return deps, nil
}

func (d *Dependencies) AttachContext(ctx context.Context) {
	d.emitter.Attach(ctx)
}

func (d *Dependencies) EmitSystemError(code string, message string) {
	d.emitter.Emit(events.SystemError, contracts.SystemErrorEvent{
		Code:    code,
		Message: message,
	})
}

func logMigration(result storage.MigrationResult) {
	if result.Status == "" {
		return
	}

	log.Printf(
		"[storage] migration status=%s source=%s destination=%s",
		result.Status,
		result.LegacySource,
		result.DestinationRoot,
	)
}

type WailsEmitter struct {
	ctx context.Context
}

func (e *WailsEmitter) Attach(ctx context.Context) {
	e.ctx = ctx
}

func (e *WailsEmitter) Emit(name string, payload any) {
	if e.ctx == nil {
		return
	}
	runtime.EventsEmit(e.ctx, name, payload)
}
