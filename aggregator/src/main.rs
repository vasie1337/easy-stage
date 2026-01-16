use anyhow::Result;
use ::scrapers::{Config, Database};
use ::scrapers::scrapers;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    
    let path = env::args().nth(1).unwrap_or_else(|| "config.toml".to_string());
    tracing::info!("loading config: {}", path);
    let config = Config::from_file(path)?;
    tracing::info!("db max connections {}", config.db_max_connections);
    let db = Database::new(&config.database_url, config.db_max_connections).await?;
    tracing::info!("connected to database");
    db.init().await?;
    tracing::info!("database initialized");
    let (a, b) = tokio::join!(
        scrapers::nvb::run(db.clone(), config.clone()),
        scrapers::stagemarkt::run(db, config)
    );
    a?;
    b?;
    Ok(())
}
