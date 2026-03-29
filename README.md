# MockFuse

MockFuse is a desktop app (Tauri + React + TypeScript) for managing local mock/proxy gateway projects so frontend and backend teams can work in parallel.

It currently focuses on:
- creating and activating a project,
- archiving/restoring project configurations,
- persisting settings and project metadata,
- basic gateway runtime controls (start/stop state).

---

## Table of Contents
- [What MockFuse Does](#what-mockfuse-does)
- [Current Feature Set](#current-feature-set)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Build for Production](#build-for-production)
- [How Data is Stored](#how-data-is-stored)
- [Tauri Command Surface](#tauri-command-surface)
- [UI Workflow](#ui-workflow)
- [Known Limitations / In-Progress Areas](#known-limitations--in-progress-areas)
- [Troubleshooting](#troubleshooting)
- [Roadmap Ideas](#roadmap-ideas)

---

## What MockFuse Does

MockFuse provides a local-first workflow for API simulation:

1. **Create a project** with gateway bind host, port, and optional upstream base URL.
2. **Set one project active** at a time.
3. **Archive and restore projects** as priorities shift.
4. **Track gateway runtime state** (running/stopped/pending abstraction in frontend).
5. **Persist app state** (settings + last active view + project registry) between sessions.

---

## Current Feature Set

### Home
- Intro dashboard and quick “Create Project” CTA.

### Projects
- Active project panel with:
  - Start/Stop gateway controls,
  - archive,
  - open folder,
  - detail view navigation.
- Archived projects list with:
  - quick view,
  - restore to active.
- Create project flow with validation for:
  - required name,
  - port range `1..65535`,
  - replace-active confirmation flow.

### Settings
- Backed by a persistent store in Rust.
- UI currently includes placeholder content; backend commands for settings updates already exist.

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- `@tauri-apps/api` for command invocation
- `react-icons`

### Desktop Backend
- Tauri v2 (Rust)
- `serde`, `serde_json`, `serde_yaml`
- `uuid`
- `tauri-plugin-opener` (used to open project folders)

---

## Project Structure

```text
MockFuse/
├─ src/                    # React app
│  ├─ components/layout/   # Sidebar + UI layout primitives
│  ├─ core/                # Tauri invoke wrappers (projects/gateway/settings)
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Projects/
│  │  │  ├─ sections/
│  │  │  └─ views/
│  │  └─ Settings.tsx
│  └─ theme/
├─ src-tauri/              # Rust/Tauri backend
│  ├─ src/commands/        # Tauri command handlers
│  ├─ src/projects_store.rs
│  ├─ src/settings.rs
│  └─ tauri.conf.json
└─ README.md
```

---

## Getting Started

## Prerequisites

Install:
- Node.js (LTS recommended)
- pnpm
- Rust toolchain (`rustup`, `cargo`)
- Tauri system prerequisites for your OS:  
  https://v2.tauri.app/start/prerequisites/

## Install dependencies

```bash
pnpm install
```

---

## Running the App

### Web-only dev (frontend)

```bash
pnpm dev
```

### Full Tauri desktop dev

```bash
pnpm tauri dev
```

---

## Build for Production

### Frontend bundle

```bash
pnpm build
```

### Tauri desktop build

```bash
pnpm tauri build
```

> Note: Tauri builds require OS-specific native dependencies/signing setup.

---

## How Data is Stored

MockFuse writes app data under Tauri's `app_data_dir`.

### Files created by backend

- `settings.json`
  - app-level settings (theme, gateway defaults, last active view/path)
- `projects.yaml`
  - registry of active + archived projects
- `projects/<project-id>/project.yaml`
  - per-project configuration scaffold, including gateway config and route list

### Recovery behavior

If `settings.json` or `projects.yaml` is corrupted:
- backend renames the broken file to a backup variant,
- recreates a default file,
- continues with defaults.

---

## Tauri Command Surface

### Gateway commands
- `gateway_status`
- `gateway_start`
- `gateway_stop`

### Project commands
- `project_set_active`
- `project_get_active`
- `projects_get_overview`
- `projects_create_project`
- `projects_archive_active`
- `projects_restore_project`

### Settings commands
- `settings_get`
- `settings_set_theme_preference`
- `settings_set_gateway`
- `settings_set_upstream_base_url`
- `settings_set_last_active_project_path`
- `settings_set_last_active_view`

---

## UI Workflow

1. Start at **Home** and click **Create Project**.
2. In **Projects**, create and activate a new project.
3. Use **Start** when routes are available (currently routes count is metadata-driven).
4. Archive current active project when switching context.
5. Restore archived projects when needed.
6. App remembers your last selected sidebar page across restarts.

---

## Known Limitations / In-Progress Areas

- Settings screen is still a placeholder UI.
- Route editing and rich YAML configuration UX are not yet implemented.
- Project detail actions (`Start`, `Stop`, `Open Folder`) are present but partially placeholder at detail-view level.
- Gateway runtime is currently represented as app state toggles; full proxy/mock request handling is future work.

---

## Troubleshooting

### `pnpm tauri dev` fails on first run
- Verify Rust toolchain is installed and up to date:
  ```bash
  rustup update
  ```
- Verify Tauri prerequisites for your OS are installed.

### Gateway start fails
- Ensure selected port is not in use.
- Validate project has endpoints once route editor is implemented.

### Data issues after crash/manual edits
- Check app data directory for backup files like `*.corrupt.*`.
- Remove/repair malformed YAML/JSON and relaunch.

---

## Roadmap Ideas

- Route CRUD editor with validation.
- Request log viewer with filtering.
- Mock/proxy per-route behavior toggles.
- Import/export projects.
- Environment profiles (dev/staging).
- Health checks and port conflict diagnostics.

---

If you contribute, prefer small focused PRs and include screenshots for notable UI changes.
