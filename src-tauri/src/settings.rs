use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::{Mutex, MutexGuard},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ThemePreference {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewaySettings {
    pub bind_host: String, // "127.0.0.1" | "localhost" | (later) "0.0.0.0"
    pub port: u16,
    pub auto_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub schema_version: u32,

    pub theme_preference: ThemePreference,
    pub gateway: GatewaySettings,
    pub upstream_base_url: Option<String>,
    pub last_active_project_path: Option<String>,

    #[serde(default)]
    pub last_active_view: Option<String>, // "home" | "projects" | "settings"
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            schema_version: 0,
            theme_preference: ThemePreference::System,
            gateway: GatewaySettings {
                bind_host: "127.0.0.1".to_string(),
                port: 4010,
                auto_start: false,
            },
            upstream_base_url: None,
            last_active_project_path: None,
            last_active_view: Some("home".to_string()),
        }
    }
}

/// Persistent store: loads/saves Settings to a JSON file.
/// Managed via `app.manage(SettingsStore)`.
pub struct SettingsStore {
    path: PathBuf,
    inner: Mutex<Settings>,
}

impl SettingsStore {
    pub fn load_or_init(path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        if !path.exists() {
            let s = Settings::default();
            fs::write(&path, serde_json::to_vec_pretty(&s)?)?;
            return Ok(Self {
                path,
                inner: Mutex::new(s),
            });
        }

        let bytes = fs::read(&path)?;
        match serde_json::from_slice::<Settings>(&bytes) {
            Ok(s) => Ok(Self {
                path,
                inner: Mutex::new(s),
            }),
            Err(e) => {
                // keep a backup for debugging; then reset to defaults
                let backup = path.with_extension(format!("corrupt.{}.json", chrono_stamp()));
                let _ = fs::rename(&path, backup);

                let s = Settings::default();
                fs::write(&path, serde_json::to_vec_pretty(&s)?)?;

                eprintln!("[Settings] corrupted settings.json, reset to defaults: {e}");
                Ok(Self {
                    path,
                    inner: Mutex::new(s),
                })
            }
        }
    }

    fn lock(&self) -> Result<MutexGuard<'_, Settings>, String> {
        self.inner
            .lock()
            .map_err(|_| "settings mutex poisoned".to_string())
    }

    pub fn get(&self) -> Result<Settings, String> {
        Ok(self.lock()?.clone())
    }

    // pub fn set(&self, next: Settings) -> Result<Settings, String> {
    //   // basic schema guard
    //   if next.schema_version != 0 {
    //     return Err("unsupported settings schema_version".into());
    //   }

    //   {
    //     let mut guard = self.lock()?;
    //     *guard = next.clone();
    //   }

    //   self.save(&next)?;
    //   Ok(next)
    // }

    pub fn update<F>(&self, f: F) -> Result<Settings, String>
    where
        F: FnOnce(&mut Settings),
    {
        let next = {
            let mut guard = self.lock()?;
            f(&mut guard);
            guard.clone()
        };

        self.save(&next)?;
        Ok(next)
    }

    fn save(&self, s: &Settings) -> Result<(), String> {
        let bytes = serde_json::to_vec_pretty(s).map_err(|e| e.to_string())?;
        fs::write(&self.path, bytes).map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn chrono_stamp() -> String {
    // avoid adding chrono dependency for now
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    ts.to_string()
}
