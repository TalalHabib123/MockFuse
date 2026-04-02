# MockFuse

MockFuse is a local-first desktop application for managing mock and proxy projects on your machine. It now runs on a Wails + Go desktop host with the existing React + TypeScript frontend carried forward from the earlier Tauri-based app.

## Current Status

As of April 2, 2026, the migration to Wails is complete and the repository is now Wails-only.

- The Rust/Tauri runtime has been removed from the active application.
- The desktop host is implemented in Go with Wails v2.
- The frontend lives in `frontend/` and talks to the host through a typed desktop abstraction.
- Windows development and production builds have been verified locally.
- The current UX for projects, settings, theme preference, archive/restore flows, folder opening, and gateway controls has been preserved.

## What MockFuse Does Today

- Stores project metadata locally on the desktop.
- Supports one active project at a time.
- Lets you create a new project and optionally replace the current active one.
- Lets you archive the active project and restore archived projects.
- Persists theme preference and last active view.
- Opens a project folder in the native OS file explorer.
- Exposes typed gateway state, start, and stop actions through the desktop host.

## Important Behavior Notes

- The gateway service currently preserves the shipped desktop behavior as typed runtime state and events. It is not yet a full long-running network proxy runtime in this migrated codebase.
- Starting the gateway requires an active project with route data available in project metadata.
- App data remains local to the machine and is stored in desktop app-data files rather than in a remote service.

## Tech Stack

- Wails v2
- Go
- React 18
- TypeScript
- Vite
- Tailwind CSS v4

## Architecture

The app is split into a typed desktop boundary and a preserved React UI:

- `main.go`, `app.go`, `wails.json`: Wails bootstrap, window configuration, and bound app methods
- `internal/`: Go services for settings, projects, storage, gateway state, contracts, events, and OS integrations
- `frontend/`: React/Vite application and generated Wails bindings
- `frontend/src/lib/desktop/`: frontend desktop abstraction used by the UI instead of direct host calls
- `docs/migration-contract-map.md`: migration contract inventory from the Tauri surface to the Wails surface

## Repository Layout

```text
.
|-- app.go
|-- main.go
|-- wails.json
|-- internal/
|   |-- app/
|   |-- config/
|   |-- contracts/
|   |-- events/
|   |-- gateway/
|   |-- platform/
|   |-- projects/
|   `-- storage/
|-- frontend/
|   |-- src/
|   |-- dist/
|   `-- wailsjs/
`-- docs/
```

## Prerequisites

Install these tools before running the app:

- Go
- Node.js
- pnpm
- Wails CLI

Install the Wails CLI if needed:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

If `wails` is not on your `PATH`, use the executable directly from your Go bin directory.

## Local Development

Install frontend dependencies:

```bash
cd frontend
pnpm install --store-dir .pnpm-store
```

Run the desktop app in development mode from the repository root:

```bash
wails dev
```

If `wails` is not available on your `PATH` on Windows:

```powershell
& "$env:USERPROFILE\go\bin\wails.exe" dev
```

## Verification Commands

Build the frontend:

```bash
cd frontend
pnpm build
```

Run the Go test suite from the repository root:

```bash
go test ./...
```

Create a production desktop build:

```bash
wails build
```

On Windows, if needed:

```powershell
& "$env:USERPROFILE\go\bin\wails.exe" build
```

The production binary is generated at:

```text
build/bin/MockFuse.exe
```

## Storage and Migration

On first Wails launch, MockFuse attempts to migrate legacy Tauri data into the new Wails-owned app-data root.

- Legacy identifier: `com.mockfuse.app`
- New app root: `MockFuse`
- Preserved files:
  - `settings.json`
  - `projects.yaml`
  - `projects/<id>/project.yaml`

Migration behavior:

- If the Wails destination is empty and legacy data exists, the legacy data is copied forward.
- If the Wails destination already contains data, that data is kept as the source of truth.
- The legacy source is left untouched as rollback protection.
- If both locations already contain data, the app avoids merging them automatically.

For local testing, the storage layer also supports the environment override:

```text
MOCKFUSE_APPDATA_ROOT
```

## Contracts and Desktop Boundary

The frontend no longer calls Tauri APIs directly. Desktop operations now go through typed contracts and a stable desktop abstraction.

Core desktop methods include:

- `GetSettings`
- `SetThemePreference`
- `SetGatewaySettings`
- `SetLastActiveView`
- `GetProjectsOverview`
- `CreateProject`
- `ArchiveActiveProject`
- `RestoreProject`
- `GetGatewayState`
- `StartGateway`
- `StopGateway`
- `OpenPath`

This keeps the UI host-agnostic and makes the Go host easier to test and evolve.

## Generated and Build Artifacts

- Generated Wails frontend bindings live in `frontend/wailsjs/`.
- Frontend production assets are emitted to `frontend/dist/`.
- Final desktop build output is placed in `build/bin/`.
- Temporary local caches used during development are ignored through `.gitignore`.

## Current Limitations

- Windows packaging has been verified, but macOS and Linux packaging have not been validated in this workspace.
- The migrated gateway layer currently models runtime state and event emission rather than a full backend proxy engine.
- The repo still contains migration documentation for reference, but the active application runtime is Wails-only.

## Summary

MockFuse is now a Wails desktop app with a React frontend, typed Go services, preserved local storage formats, and a stable desktop contract boundary. The project is in a usable migrated state, with local development, tests, and Windows production builds working from the current repository structure.
