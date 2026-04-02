# MockFuse Migration Contract Map

## Legacy Tauri Surface

| Current command/plugin | Frontend usage | Input | Output | Side effects | Wails replacement |
| --- | --- | --- | --- | --- | --- |
| `settings_get` | `App.tsx`, `ThemeProvider.tsx` | none | `Settings` | reads `settings.json` | `GetSettings()` |
| `settings_set_theme_preference` | `ThemeProvider.tsx`, `ThemeSwitcher.tsx` | `preference` | `Settings` | updates `themePreference` | `SetThemePreference(preference)` |
| `settings_set_gateway` | not yet used in UI | `bindHost`, `port` | `Settings` | updates gateway defaults | `SetGatewaySettings(request)` |
| `settings_set_last_active_view` | `App.tsx` | `view` | `Settings` | updates `lastActiveView` | `SetLastActiveView(view)` |
| `projects_get_overview` | `Projects.tsx` | none | `ProjectsOverview` | reads `projects.yaml` | `GetProjectsOverview()` |
| `projects_create_project` | `Projects.tsx` | `CreateProjectInput` | `ProjectSummary` | writes `projects.yaml` and `projects/<id>/project.yaml` | `CreateProject(input)` |
| `projects_archive_active` | `Projects.tsx` | none | void | archives active project in `projects.yaml` | `ArchiveActiveProject()` |
| `projects_restore_project` | `Projects.tsx` | `id` | `ProjectSummary` | restores archived project and archives current active | `RestoreProject(request)` |
| `gateway_status` | `Projects.tsx`, `ActiveProjectPanel.tsx` | none | `bool` | reads runtime state | `GetGatewayState()` |
| `gateway_start` | `ActiveProjectPanel.tsx` | legacy optional `port` mismatch | void | sets runtime running flag | `StartGateway()` |
| `gateway_stop` | `Projects.tsx`, `ActiveProjectPanel.tsx` | none | void | clears runtime running flag | `StopGateway()` |
| `@tauri-apps/plugin-opener openPath` | `ActiveProjectPanel.tsx` | project root path | void | opens OS file explorer | `OpenPath(request)` |

## Stable Wails Contracts

- `Settings`
- `GatewaySettings`
- `ProjectSummary`
- `ProjectsOverview`
- `CreateProjectInput`
- `RestoreProjectRequest`
- `OpenPathRequest`
- `GatewayStateResponse`
- `GatewayStateChangedEvent`
- `SystemErrorEvent`

## Storage Compatibility

- Legacy root candidates: `com.mockfuse.app`
- New Wails root: `MockFuse`
- Preserved files: `settings.json`, `projects.yaml`, `projects/<id>/project.yaml`
