use std::sync::Arc;
use tauri::State;

#[derive(Default)]
pub struct AppState {
    // v0 placeholders; we’ll flesh these out when implementing
    pub active_project_path: Arc<std::sync::Mutex<Option<String>>>,
    pub gateway_running: Arc<std::sync::Mutex<bool>>,
}

pub type AppStateHandle<'a> = State<'a, AppState>;
