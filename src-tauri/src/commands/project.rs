use crate::state::AppStateHandle;
use serde::Serialize;
use tauri::State;

use crate::projects_store::{ProjectRecord, ProjectsStore, CreateProjectInput};

#[tauri::command]
pub fn project_set_active(state: AppStateHandle, path: String) -> Result<(), String> {
    let mut p = state
        .active_project_path
        .lock()
        .map_err(|_| "state poisoned")?;
    *p = Some(path);
    Ok(())
}

#[tauri::command]
pub fn project_get_active(state: AppStateHandle) -> Result<Option<String>, String> {
    let p = state
        .active_project_path
        .lock()
        .map_err(|_| "state poisoned")?;
    Ok(p.clone())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectsOverview {
    pub active: Option<ProjectRecord>,
    pub archived: Vec<ProjectRecord>,
}

#[tauri::command]
pub fn projects_get_overview(store: State<'_, ProjectsStore>) -> Result<ProjectsOverview, String> {
    let (active, archived) = store.overview()?;
    Ok(ProjectsOverview { active, archived })
}

#[tauri::command]
pub fn projects_create_project(
  store: State<'_, ProjectsStore>,
  name: String,
  bind_host: String,
  port: u16,
  upstream_base_url: Option<String>,
  replace_active: Option<bool>,
) -> Result<ProjectRecord, String> {
  let input = CreateProjectInput {
    name,
    bind_host,
    port,
    upstream_base_url,
    replace_active: replace_active.unwrap_or(false),
  };
  store.create_project(input)
}

#[tauri::command]
pub fn projects_archive_active(store: State<'_, ProjectsStore>) -> Result<(), String> {
  store.archive_active()
}

#[tauri::command]
pub fn projects_restore_project(
  store: State<'_, ProjectsStore>,
  id: String,
) -> Result<ProjectRecord, String> {
  store.restore_project(&id)
}