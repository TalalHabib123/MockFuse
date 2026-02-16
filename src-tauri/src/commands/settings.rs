use tauri::State;

use crate::settings::{Settings, SettingsStore, ThemePreference};

#[tauri::command]
pub fn settings_get(store: State<'_, SettingsStore>) -> Result<Settings, String> {
  store.get()
}

#[tauri::command]
pub fn settings_set_theme_preference(
  store: State<'_, SettingsStore>,
  preference: ThemePreference,
) -> Result<Settings, String> {
  store.update(|s| s.theme_preference = preference)
}

#[tauri::command]
pub fn settings_set_gateway(
  store: State<'_, SettingsStore>,
  bind_host: String,
  port: u16,
) -> Result<Settings, String> {
  store.update(|s| {
    s.gateway.bind_host = bind_host;
    s.gateway.port = port;
  })
}

#[tauri::command]
pub fn settings_set_upstream_base_url(
  store: State<'_, SettingsStore>,
  base_url: Option<String>,
) -> Result<Settings, String> {
  store.update(|s| s.upstream_base_url = base_url)
}

#[tauri::command]
pub fn settings_set_last_active_project_path(
  store: State<'_, SettingsStore>,
  path: Option<String>,
) -> Result<Settings, String> {
  store.update(|s| s.last_active_project_path = path)
}

#[tauri::command]
pub fn settings_set_last_active_view(
  store: tauri::State<'_, SettingsStore>,
  view: String,
) -> Result<Settings, String> {
  let v = view.as_str();
  if v != "home" && v != "projects" && v != "settings" {
    return Err("invalid view".into());
  }

  store.update(|s| s.last_active_view = Some(view))
}
