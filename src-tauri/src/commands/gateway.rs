use crate::state::AppStateHandle;

#[tauri::command]
pub fn gateway_status(state: AppStateHandle) -> Result<bool, String> {
  let running = state.gateway_running.lock().map_err(|_| "state poisoned")?;
  Ok(*running)
}

#[tauri::command]
pub fn gateway_start(state: AppStateHandle, _port: u16) -> Result<(), String> {
  let mut running = state.gateway_running.lock().map_err(|_| "state poisoned")?;
  if *running {
    return Err("gateway already running".into());
  }
  *running = true;
  Ok(())
}

#[tauri::command]
pub fn gateway_stop(state: AppStateHandle) -> Result<(), String> {
  let mut running = state.gateway_running.lock().map_err(|_| "state poisoned")?;
  *running = false;
  Ok(())
}
