use anyhow::Result;
use serde::Deserialize;
use std::env;

#[derive(Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    #[serde(default = "default_db_max_connections")]
    pub db_max_connections: u32,
    #[serde(default = "default_scraper_max_workers")]
    pub scraper_max_workers: usize,
    #[serde(default)]
    pub proxy: Option<String>,
    pub nvb_max_pages: Option<i32>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let mut cfg = Config {
            database_url: get_env_required("DATABASE_URL")?,
            db_max_connections: get_env_optional("DB_MAX_CONNECTIONS")
                .as_deref()
                .and_then(|v| v.parse::<u32>().ok())
                .unwrap_or_else(default_db_max_connections),
            scraper_max_workers: get_env_optional("SCRAPER_MAX_WORKERS")
                .as_deref()
                .and_then(|v| v.parse::<usize>().ok())
                .unwrap_or_else(default_scraper_max_workers),
            proxy: get_env_optional("SCRAPER_PROXY"),
            nvb_max_pages: get_env_optional("NVB_MAX_PAGES")
                .as_deref()
                .and_then(|v| v.parse::<i32>().ok())
                .or_else(default_nvb_max_pages),
        };
        if matches!(cfg.proxy.as_deref(), Some("")) {
            cfg.proxy = None;
        }
        Ok(cfg)
    }
}

fn default_db_max_connections() -> u32 {
    50
}

fn default_scraper_max_workers() -> usize {
    200
}

fn default_nvb_max_pages() -> Option<i32> {
    None
}

fn get_env_required(key: &str) -> Result<String> {
    let value = env::var(key).map_err(|_| anyhow::anyhow!("missing required env var: {}", key))?;
    Ok(value)
}

fn get_env_optional(key: &str) -> Option<String> {
    match env::var(key) {
        Ok(value) => Some(value),
        Err(_) => None,
    }
}
