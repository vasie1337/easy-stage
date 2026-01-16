use anyhow::Result;
use ::scrapers::{Config, Database, load_dotenv};
use ::scrapers::scrapers;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    
    let _ = load_dotenv();
    let config = Config::from_env()?;
    let db = Database::new(&config.database_url, config.db_max_connections).await?;
    db.init().await?;
    scrapers::stagemarkt::run(db, config).await?;
    Ok(())
}
