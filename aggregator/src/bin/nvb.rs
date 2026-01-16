use anyhow::Result;
use ::scrapers::{Config, Database};
use ::scrapers::scrapers;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    
    let path = env::args().nth(1).unwrap_or_else(|| "config.toml".to_string());
    let config = Config::from_file(path)?;
    let db = Database::new(&config.database_url, config.db_max_connections).await?;
    db.init().await?;
    scrapers::nvb::run(db, config).await?;
    Ok(())
}
