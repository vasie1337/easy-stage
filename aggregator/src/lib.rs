pub mod config;
pub mod db;
pub mod http;
pub mod models;
pub mod scrapers;

pub use config::Config;
pub use db::Database;

pub fn load_dotenv() -> Result<(), dotenv::Error> {
    if let Ok(path) = std::env::var("DOTENV_PATH") {
        dotenv::from_filename(path).map(|_| ())
    } else {
        dotenv::dotenv().map(|_| ())
    }
}