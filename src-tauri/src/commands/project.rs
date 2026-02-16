use crate::state::AppStateHandle;

#[tauri::command]
pub fn project_set_active(state: AppStateHandle, path: String) -> Result<(), String> {
  let mut p = state.active_project_path.lock().map_err(|_| "state poisoned")?;
  *p = Some(path);
  Ok(())
}

#[tauri::command]
pub fn project_get_active(state: AppStateHandle) -> Result<Option<String>, String> {
  let p = state.active_project_path.lock().map_err(|_| "state poisoned")?;
  Ok(p.clone())
}
