use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayConfig {
    pub bind_host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRecord {
    pub id: String,
    pub name: String,
    pub root_dir: String,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub archived: bool,

    #[serde(default)]
    pub gateway: Option<GatewayConfig>,
    #[serde(default)]
    pub upstream_base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectsFile {
    pub schema_version: u32,
    #[serde(default)]
    pub active_project_id: Option<String>,
    #[serde(default)]
    pub projects: Vec<ProjectRecord>,
}

impl Default for ProjectsFile {
    fn default() -> Self {
        Self {
            schema_version: 0,
            active_project_id: None,
            projects: vec![],
        }
    }
}

pub struct ProjectsStore {
    path: PathBuf,
    inner: Mutex<ProjectsFile>,
}

impl ProjectsStore {
    pub fn load_or_init(path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        if !path.exists() {
            let f = ProjectsFile::default();
            fs::write(&path, serde_yaml::to_string(&f)?)?;
            return Ok(Self {
                path,
                inner: Mutex::new(f),
            });
        }

        let txt = fs::read_to_string(&path)?;
        match serde_yaml::from_str::<ProjectsFile>(&txt) {
            Ok(f) => Ok(Self {
                path,
                inner: Mutex::new(f),
            }),
            Err(e) => {
                let backup = path.with_extension("corrupt.yaml");
                let _ = fs::rename(&path, backup);

                let f = ProjectsFile::default();
                fs::write(&path, serde_yaml::to_string(&f)?)?;

                eprintln!("[Projects] corrupted projects.yaml, reset: {e}");
                Ok(Self {
                    path,
                    inner: Mutex::new(f),
                })
            }
        }
    }

    pub fn overview(&self) -> Result<(Option<ProjectRecord>, Vec<ProjectRecord>), String> {
        let guard = self
            .inner
            .lock()
            .map_err(|_| "projects mutex poisoned".to_string())?;
        let active = guard
            .active_project_id
            .as_ref()
            .and_then(|id| guard.projects.iter().find(|p| p.id == *id && !p.archived))
            .cloned();

        let archived = guard
            .projects
            .iter()
            .filter(|p| p.archived)
            .cloned()
            .collect();
        Ok((active, archived))
    }

    fn save(&self, f: &ProjectsFile) -> Result<(), String> {
        let txt = serde_yaml::to_string(f).map_err(|e| e.to_string())?;
        fs::write(&self.path, txt).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn now_stamp() -> String {
        use std::time::{SystemTime, UNIX_EPOCH};
        let s = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        s.to_string()
    }

    pub fn create_project(
        &self,
        name: String,
        bind_host: String,
        port: u16,
        upstream_base_url: Option<String>,
    ) -> Result<ProjectRecord, String> {
        if name.trim().is_empty() {
            return Err("project name is required".into());
        }
        if port == 0 {
            return Err("port must be 1..65535".into());
        }

        let mut guard = self
            .inner
            .lock()
            .map_err(|_| "projects mutex poisoned".to_string())?;

        // archive current active (v1 rule: one active at a time)
        if let Some(active_id) = guard.active_project_id.clone() {
            if let Some(p) = guard.projects.iter_mut().find(|p| p.id == active_id) {
                p.archived = true;
                p.updated_at = Some(Self::now_stamp());
            }
        }

        let id = Uuid::new_v4().to_string();

        // store each project under app_data/projects/<id>/project.yaml
        let base_dir = self
            .path
            .parent()
            .ok_or("invalid projects store path")?
            .join("projects");

        let project_dir = base_dir.join(&id);
        fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

        let project_yaml_path = project_dir.join("project.yaml");

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct ProjectYaml<'a> {
            schema_version: u32,
            id: &'a str,
            name: &'a str,
            gateway: GatewayConfig,
            upstream_base_url: Option<String>,
            created_at: String,
            updated_at: String,
        }

        let stamp = Self::now_stamp();
        let yaml = ProjectYaml {
            schema_version: 0,
            id: &id,
            name: name.trim(),
            gateway: GatewayConfig {
                bind_host: bind_host.clone(),
                port,
            },
            upstream_base_url: upstream_base_url.clone(),
            created_at: stamp.clone(),
            updated_at: stamp.clone(),
        };

        let txt = serde_yaml::to_string(&yaml).map_err(|e| e.to_string())?;
        fs::write(&project_yaml_path, txt).map_err(|e| e.to_string())?;

        let rec = ProjectRecord {
            id: id.clone(),
            name: name.trim().to_string(),
            root_dir: project_dir.to_string_lossy().to_string(),
            updated_at: Some(stamp),
            archived: false,
            gateway: Some(GatewayConfig { bind_host, port }),
            upstream_base_url,
        };

        guard.projects.push(rec.clone());
        guard.active_project_id = Some(id);

        self.save(&guard)?;
        Ok(rec)
    }
}
