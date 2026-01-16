use anyhow::Result;
use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    #[serde(default = "default_db_max_connections")]
    pub db_max_connections: u32,
    pub stagemarkt_max_workers: usize,
    pub stagemarkt_location: String,
    pub stagemarkt_niveaus: Vec<i32>,
    pub nvb_limit: i32,
    pub nvb_max_pages: Option<i32>,
    pub nvb_max_workers: usize,
    pub proxy_stagemarkt: Option<String>,
    pub proxy_nvb: Option<String>,
}

impl Config {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = fs::read_to_string(path)?;
        let mut cfg = toml::from_str::<Config>(&content)?;
        if matches!(cfg.proxy_stagemarkt.as_deref(), Some("")) {
            cfg.proxy_stagemarkt = None;
        }
        if matches!(cfg.proxy_nvb.as_deref(), Some("")) {
            cfg.proxy_nvb = None;
        }
        Ok(cfg)
    }
}

fn default_db_max_connections() -> u32 {
    50
}
