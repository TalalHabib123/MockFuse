# MockFuse Migration Plan: Tauri/Rust -> Wails/Go + React

## Goal
Migrate MockFuse from a Tauri + Rust backend architecture to a Wails + Go + React architecture while preserving:
- existing product behavior
- existing React frontend as much as possible
- cross-platform desktop support for Windows, macOS, and Linux
- local-first execution model
- current project concepts, archive/restore flows, and gateway behavior

## Non-Goals
- Do not redesign the product UX unless required by platform differences
- Do not rewrite the React app from scratch
- Do not change core project data formats unless necessary
- Do not optimize features that are not yet stable
- Do not introduce a separate HTTP backend unless there is a strong reason

## Architecture Decision
Use Wails as the desktop runtime and Go as the only backend language.

Reasoning:
- Wails is designed for Go + web frontend desktop apps
- React/Vite frontend can be reused
- Go methods can be bound directly to the frontend
- Go and JS can communicate through bindings and events
- This removes the Rust host layer and avoids a Tauri + Go sidecar dual-runtime architecture

## High-Level Target Architecture

### Frontend
- React + TypeScript + Vite
- Existing pages/components reused where possible
- No direct Tauri API calls in feature code
- All desktop/backend calls go through a single adapter layer

### Desktop Host
- Wails app bootstrap
- Window lifecycle
- native dialogs / OS integration as needed
- event emission from Go to frontend

### Go Core
Organize Go into packages:

- internal/app
  - Wails app bootstrap and lifecycle glue
- internal/projects
  - create/read/update/archive/restore project logic
- internal/gateway
  - start/stop gateway processes
  - mock/proxy runtime orchestration
  - health/state transitions
- internal/config
  - settings loading/saving
- internal/storage
  - filesystem/json/sqlite access
- internal/contracts
  - shared DTOs between frontend and Go
- internal/events
  - event names and payload helpers
- internal/logging
  - structured logs
- internal/platform
  - OS-specific helpers where needed

## Migration Strategy
Use a strangler migration, not a big-bang rewrite.

### Phase 1 - Audit and freeze contracts
1. Inventory all current Rust/Tauri commands and events
2. Inventory all frontend usage of Tauri APIs
3. Inventory all persistence formats:
   - project metadata
   - archive state
   - settings
   - gateway runtime config
4. Create a migration map:
   - current command name
   - current input payload
   - current output payload
   - side effects
   - replacement Go service method

Deliverable:
- `docs/migration-contract-map.md`

### Phase 2 - Create frontend adapter boundary
Refactor frontend so feature code does not call Tauri APIs directly.

Create:
- `src/lib/desktop/DesktopAPI.ts`
- `src/lib/desktop/types.ts`
- `src/lib/desktop/events.ts`

Rules:
- all backend calls go through `DesktopAPI`
- all event subscriptions go through `DesktopEvents`
- components must not import Tauri packages directly

Add a temporary Tauri implementation:
- `src/lib/desktop/adapters/tauriDesktop.ts`

Goal:
The React app should still run on Tauri, but only through the adapter.

Deliverable:
- frontend compiles and behaves the same
- direct Tauri imports removed from feature components

### Phase 3 - Define stable contracts
Create shared DTOs in TypeScript and matching Go structs.

Examples:
- ProjectSummary
- ProjectDetails
- ArchiveProjectRequest
- RestoreProjectRequest
- GatewayState
- GatewayStartRequest
- GatewayStopRequest
- EndpointDefinition
- RouteDefinition
- ProxyTarget
- AppSettings

Rules:
- preserve current shape where possible
- use explicit enums for status fields
- avoid map[string]any unless truly necessary

Deliverables:
- `src/lib/contracts/*`
- `internal/contracts/*`

### Phase 4 - Scaffold Wails host
Create a new Wails app and integrate the existing React frontend.

Suggested layout:
- `/frontend` -> existing React app
- `/main.go`
- `/app.go`
- `/internal/...`

Tasks:
1. scaffold Wails app with React/TS frontend support
2. move existing React app into `frontend/`
3. ensure frontend builds under Wails
4. define bootstrap `App` struct
5. wire startup/shutdown lifecycle
6. expose minimal health method to frontend

Deliverable:
- Wails app launches existing React shell successfully

### Phase 5 - Implement Go service layer
Do NOT put business logic directly inside Wails-bound methods.

Pattern:
- Wails-bound methods call service layer
- service layer performs actual work
- services are testable without Wails runtime

Example:
- `App.ListProjects()` -> `projectsService.List()`
- `App.ArchiveProject(id)` -> `projectsService.Archive(id)`
- `App.StartGateway(projectID)` -> `gatewayService.Start(projectID)`

Rules:
- Wails layer remains thin
- no UI logic in Go services
- no filesystem logic in React

### Phase 6 - Port features by slice
Port one vertical slice at a time.

Recommended order:
1. app settings + project listing
2. create/open project
3. archive/restore
4. project details page
5. gateway state/status
6. start/stop gateway
7. logs/event streaming
8. endpoint editing
9. proxy mode
10. sockets/SSE behavior
11. import/export
12. open-path / external app integration

Each slice must include:
- contract
- Go implementation
- Wails binding
- frontend adapter implementation
- UI smoke validation

### Phase 7 - Event-driven updates
Use Wails events for:
- gateway status changes
- live logs
- long-running task progress
- background errors
- file change notifications if needed

Frontend should subscribe once near app root and push state into the store.

Rules:
- no polling for things that are event-worthy
- define event names centrally
- all event payloads typed

Example events:
- `gateway:state_changed`
- `gateway:log`
- `project:updated`
- `project:archived`
- `project:restored`
- `system:error`

### Phase 8 - Process and network orchestration in Go
Rebuild all local server/process management in Go.

Capabilities:
- spawn/stop child processes
- reserve/check ports
- manage multiple gateways
- stream logs
- restart on failure where appropriate
- track pending/running/stopped/error states

Rules:
- explicit lifecycle ownership
- prevent orphan processes
- graceful shutdown on app exit
- structured logs with correlation by project ID

### Phase 9 - Persistence compatibility
Preserve current project data and settings where possible.

Tasks:
- document old storage format
- load legacy format in Go
- if schema changes are needed, write a one-time migration
- version project metadata

Add:
- `schema_version`
- migration helpers for legacy projects

Rules:
- opening an old project should not silently corrupt data
- all write operations should be atomic where possible

### Phase 10 - Cross-platform packaging
Set up builds for:
- Windows
- macOS
- Linux

Tasks:
- verify file/path separators
- verify executable permissions on macOS/Linux
- verify local process spawning on each OS
- verify storage directories
- verify deep links / open-path if needed

Deliverables:
- build instructions
- release checklist
- known platform differences doc

## Frontend Refactor Rules
- preserve current routes/pages/components as much as possible
- replace Tauri imports with adapter calls
- all async desktop interactions go through React Query or a dedicated state layer if already present
- all live state should come from typed events or typed refresh methods
- UI must handle optimistic vs confirmed states correctly

## Backend Design Rules
- separate domain logic from Wails glue
- use context-aware service methods where appropriate
- return typed errors
- use structured logging
- keep packages cohesive
- do not hide business logic inside goroutines without supervision

## Suggested Repo Structure

/
  main.go
  app.go
  wails.json
  go.mod
  internal/
    app/
    contracts/
    config/
    events/
    gateway/
    logging/
    platform/
    projects/
    storage/
  frontend/
    src/
      components/
      pages/
      lib/
        contracts/
        desktop/
          DesktopAPI.ts
          DesktopEvents.ts
          adapters/
            wailsDesktop.ts
            tauriDesktop.ts   # temporary during migration only
      store/
      hooks/
    package.json

## Command Mapping Template
Create a mapping document with this format:

- Current command/event:
- Used by frontend files:
- Input shape:
- Output shape:
- Side effects:
- Current persistence touched:
- Go replacement:
- Wails binding name:
- Migration status:

## Acceptance Criteria

### Functional
- existing React UX preserved for core workflows
- projects can be created/opened/archived/restored
- project details page works
- gateway can start/stop
- gateway state updates reach UI correctly
- logs stream into UI
- local config persists
- import/export works if previously supported

### Technical
- no Rust business logic remains
- no direct Tauri imports remain in feature components
- Go services are unit-testable
- Wails bindings are thin
- frontend and backend contracts are typed
- no orphan child processes on app shutdown

### Cross-platform
- app launches on Windows, macOS, Linux
- project storage path works on all platforms
- process spawn/kill behavior verified on all platforms
- UI and gateway lifecycle consistent across platforms

## Risks
1. Tauri-specific frontend assumptions hidden in components
2. process lifecycle differences across OSes
3. filesystem/open-path behavior differences
4. sockets/SSE behavior under local desktop-managed processes
5. legacy project format incompatibilities

## Risk Mitigation
- add adapter boundary first
- migrate vertical slices incrementally
- keep legacy loaders during transition
- centralize process management in Go
- define event contracts before implementation

## Things the agent must NOT do
- do not rewrite the entire frontend
- do not mix business logic into Wails bootstrap files
- do not keep half the features on direct Tauri calls
- do not introduce untyped event payloads
- do not create parallel storage formats without versioning
- do not port blindly without a command/event inventory

## First Implementation Milestone
Complete this exact milestone first:

1. existing React app runs inside Wails
2. DesktopAPI abstraction exists
3. project list loads from Go
4. archive/restore works from Go
5. project detail page can open
6. gateway state can be read from Go
7. no direct Tauri usage remains in those migrated flows

Only after this milestone should start/stop gateway runtime and logs be migrated.