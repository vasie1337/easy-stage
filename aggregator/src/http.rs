use anyhow::{anyhow, Result};
use reqwest::header::{HeaderMap, HeaderValue, CONNECTION};
use reqwest::{Client, StatusCode};
use serde_json::Value;
use std::time::{Duration};
use tokio::time::sleep;


fn base_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(CONNECTION, HeaderValue::from_static("close"));
    headers
}

pub fn build_client(proxy_url: Option<&str>) -> Result<Client> {
    let headers = base_headers();
    build_with_headers(proxy_url, headers)
}

pub fn build_client_with_headers(proxy_url: Option<&str>, extra: HeaderMap) -> Result<Client> {
    let mut headers = base_headers();
    for (k, v) in extra.iter() {
        headers.insert(k, v.clone());
    }
    build_with_headers(proxy_url, headers)
}

fn build_with_headers(proxy_url: Option<&str>, headers: HeaderMap) -> Result<Client> {

    let mut builder = Client::builder()
        .default_headers(headers)
        .pool_max_idle_per_host(500)
        .pool_idle_timeout(Duration::from_secs(90))
        .timeout(Duration::from_secs(60));

    if let Some(proxy) = proxy_url {
        tracing::info!("using proxy: {}", proxy);
        builder = builder.proxy(reqwest::Proxy::all(proxy)?);
    }

    Ok(builder.build()?)
}

pub async fn get_json(
    client: &Client,
    url: &str,
    params: &[(&str, String)],
    retries: usize,
) -> Result<Option<Value>> {
    get_json_with_retries(client, url, params, retries).await
}

pub async fn get_json_with_retries(
    client: &Client,
    url: &str,
    params: &[(&str, String)],
    retries: usize,
) -> Result<Option<Value>> {
    let mut attempt = 0;
    loop {
        let result = client.get(url).query(params).send().await;
        
        match result {
            Ok(resp) => {
                if resp.status() == StatusCode::NO_CONTENT {
                    return Ok(None);
                }
                if resp.status().is_success() {
                    let v = resp.json::<Value>().await?;
                    return Ok(Some(v));
                }
                if resp.status().is_server_error() || resp.status() == StatusCode::TOO_MANY_REQUESTS {
                    attempt += 1;
                    if attempt >= retries {
                        return Err(anyhow!("request failed: {}", resp.status()));
                    }
                    let backoff = 500u64 * (attempt as u64).saturating_mul(2);
                    sleep(Duration::from_millis(backoff)).await;
                    continue;
                }
                return Err(anyhow!("request failed: {}", resp.status()));
            }
            Err(e) => {
                attempt += 1;
                if attempt >= retries {
                    return Err(e.into());
                }
                let backoff = 500u64 * (attempt as u64).saturating_mul(2);
                sleep(Duration::from_millis(backoff)).await;
            }
        }
    }
}
