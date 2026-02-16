#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod core;
mod settings;
mod state;

use tauri::Manager; // for app.manage + path access

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // app data dir path (create if needed)
      let dir = app.path().app_data_dir()?;         // v2-style access :contentReference[oaicite:2]{index=2}
      std::fs::create_dir_all(&dir)?;               // ensure directory exists :contentReference[oaicite:3]{index=3}

      let settings_path = dir.join("settings.json");
      let settings_store = settings::SettingsStore::load_or_init(settings_path)?;

      app.manage(settings_store);
      Ok(())
    })
    .manage(state::AppState::default()) // your runtime state (gateway running, etc.)
    .invoke_handler(tauri::generate_handler![
      // existing
      commands::gateway::gateway_status,
      commands::gateway::gateway_start,
      commands::gateway::gateway_stop,
      commands::project::project_set_active,
      commands::project::project_get_active,
      // new
      commands::settings::settings_get,
      commands::settings::settings_set_theme_preference,
      commands::settings::settings_set_gateway,
      commands::settings::settings_set_upstream_base_url,
      commands::settings::settings_set_last_active_project_path,
      commands::settings::settings_set_last_active_view,

    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
