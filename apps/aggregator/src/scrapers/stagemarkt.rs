use anyhow::Result;
use futures::stream::{self, StreamExt};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Semaphore;

use crate::config::Config;
use crate::db::Database;
use crate::http;
use crate::models::{CompanyRecord, ListingRecord, MediaRecord};
use crate::scrapers::{empty_array, empty_object, get_f64, get_i32, get_string, join_location};

const BASE_URL: &str = "https://stagemarkt.nl/api/query-hub";
const SITE_ID: &str = "STAGEMARKT";
const DEFAULT_LOCATION: &str = "Utrecht";
const DEFAULT_NIVEAUS: &[i32] = &[4];

pub async fn run(db: Database, config: Config) -> Result<()> {
    run_inner(db, config).await
}

async fn run_inner(db: Database, config: Config) -> Result<()> {
    tracing::info!("stagemarkt start");
    let client = http::build_client(config.proxy.as_deref())?;
    let mut seen = HashSet::new();
    let mut total_companies = 0usize;
    let mut total_listings = 0usize;
    let start_total = Instant::now();
    for niveau in DEFAULT_NIVEAUS.iter() {
        let start_niveau = Instant::now();
        tracing::info!("stagemarkt niveau {}", niveau);
        let opleidingen = get_opleidingen(&client, *niveau).await?;
        tracing::info!("stagemarkt niveau {} opleidingen {}", niveau, opleidingen.len());
        if opleidingen.is_empty() {
            continue;
        }
        let crebo_codes: Vec<i64> = opleidingen
            .iter()
            .filter_map(|v| v.get("creboCode").and_then(|c| c.as_i64()))
            .collect();
        let search_workers = config.scraper_max_workers.min(100);
        let search_results: Vec<Vec<Value>> = stream::iter(crebo_codes)
            .map(|code| {
                let client = client.clone();
                async move { search_internships(&client, code, *niveau, DEFAULT_LOCATION).await }
            })
            .buffer_unordered(search_workers)
            .filter_map(|r| async move { r.ok() })
            .collect()
            .await;
        let mut new_ids = Vec::new();
        for list in search_results.into_iter() {
            for item in list.into_iter() {
                if let Some(id) = item.get("leerplaatsId").and_then(|v| v.as_str()) {
                    if seen.insert(id.to_string()) {
                        new_ids.push((id.to_string(), item));
                    }
                }
            }
        }
        tracing::info!("stagemarkt niveau {} listings {}", niveau, new_ids.len());
        if new_ids.is_empty() {
            continue;
        }
        let total_niveau = new_ids.len();
        let processed = Arc::new(AtomicUsize::new(0));
        let errors = Arc::new(AtomicUsize::new(0));
        let semaphore = Arc::new(Semaphore::new(config.scraper_max_workers));
        let db_clone = db.clone();
        let client_clone = client.clone();
        let niveau_val = *niveau;
        let processed_clone = processed.clone();
        let errors_clone = errors.clone();
        let processed: Vec<Result<()>> = stream::iter(new_ids)
            .map(|(id, item)| {
                let db = db_clone.clone();
                let client = client_clone.clone();
                let sem = semaphore.clone();
                let processed = processed_clone.clone();
                let errors = errors_clone.clone();
                async move {
                    let _permit = sem.acquire().await;
                    let details = get_internship_details(&client, &id).await.ok().flatten();
                    let (company, listing, media) = transform_listing(&item, details, niveau_val);
                    
                    if let Err(e) = db.upsert_company(&company).await {
                        errors.fetch_add(1, Ordering::Relaxed);
                        tracing::error!("stagemarkt db error: {}", e);
                        return Err(e);
                    }
                    if let Err(e) = db.upsert_listing(&listing).await {
                        errors.fetch_add(1, Ordering::Relaxed);
                        tracing::error!("stagemarkt db error: {}", e);
                        return Err(e);
                    }
                    if let Err(e) = db.upsert_media(&listing.listing_id, media).await {
                        errors.fetch_add(1, Ordering::Relaxed);
                        tracing::error!("stagemarkt db error: {}", e);
                        return Err(e);
                    }
                    
                    let done = processed.fetch_add(1, Ordering::Relaxed) + 1;
                    if done % 200 == 0 {
                        let elapsed = start_niveau.elapsed().as_secs_f64();
                        if elapsed > 0.0 {
                            let rate = done as f64 / elapsed;
                            let remaining = total_niveau.saturating_sub(done);
                            let eta_secs = if rate > 0.0 { (remaining as f64 / rate) as u64 } else { 0 };
                            tracing::info!(
                                "stagemarkt niveau {} progress {}/{} rate {:.1}/s eta {}s",
                                niveau_val,
                                done,
                                total_niveau,
                                rate,
                                eta_secs
                            );
                        }
                    }
                    Ok::<(), anyhow::Error>(())
                }
            })
            .buffer_unordered(config.scraper_max_workers)
            .collect::<Vec<_>>()
            .await;
        
        let ok_count = processed.iter().filter(|r| r.is_ok()).count();
        let err_count = errors.load(Ordering::Relaxed);
        
        total_companies += ok_count;
        total_listings += ok_count;
        tracing::info!(
            "stagemarkt niveau {} processed {} errors {} elapsed {:?}",
            niveau,
            ok_count,
            err_count,
            start_niveau.elapsed()
        );
    }
    
    tracing::info!(
        "stagemarkt done: companies {} listings {} elapsed {:?}",
        total_companies,
        total_listings,
        start_total.elapsed()
    );
    Ok(())
}

async fn get_opleidingen(client: &reqwest::Client, niveau: i32) -> Result<Vec<Value>> {
    let params = vec![
        ("siteId", SITE_ID.to_string()),
        ("niveau", niveau.to_string()),
        ("term", "".to_string()),
        ("pageSize", "9999".to_string()),
    ];
    let data = match http::get_json_with_retries(client, &format!("{BASE_URL}/opleiding-suggesties"), &params, 5).await? {
        Some(v) => v,
        None => return Ok(Vec::new()),
    };
    
    if let Some(items) = data.get("body").and_then(|b| b.get("data")).and_then(|d| d.get("items")).and_then(|i| i.as_array()) {
        return Ok(items.clone());
    }
    if let Some(items) = data.get("data").and_then(|d| d.get("items")).and_then(|i| i.as_array()) {
        return Ok(items.clone());
    }
    Ok(Vec::new())
}

async fn search_internships(
    client: &reqwest::Client,
    crebo_code: i64,
    niveau: i32,
    location: &str,
) -> Result<Vec<Value>> {
    let params = vec![
        ("siteId", SITE_ID.to_string()),
        ("pageSize", "9999".to_string()),
        ("niveau", niveau.to_string()),
        ("type", "1".to_string()),
        ("range", "9999".to_string()),
        ("crebocode", crebo_code.to_string()),
        ("plaatsPostcode", location.to_string()),
        ("buitenlandseBedrijven", "true".to_string()),
    ];
    let data = match http::get_json_with_retries(client, &format!("{BASE_URL}/education-search"), &params, 3).await? {
        Some(v) => v,
        None => return Ok(Vec::new()),
    };
    
    let items = data.get("items").and_then(|i| i.as_array()).cloned().unwrap_or_default();
    Ok(items)
}

async fn get_internship_details(client: &reqwest::Client, internship_id: &str) -> Result<Option<Value>> {
    let params = vec![
        ("siteId", SITE_ID.to_string()),
        ("id", internship_id.to_string()),
    ];
    http::get_json_with_retries(client, &format!("{BASE_URL}/education-detail"), &params, 3).await
}

fn transform_listing(
    search_item: &Value,
    details: Option<Value>,
    niveau: i32,
) -> (CompanyRecord, ListingRecord, Vec<MediaRecord>) {
    let d = details.unwrap_or_else(empty_object);
    let org_data = search_item.get("organisatie").cloned().unwrap_or_else(empty_object);
    let org_detail = d.get("organisatie").cloned().unwrap_or_else(empty_object);
    let company = transform_company(&org_data, &org_detail);
    let listing = build_listing(search_item, &d, niveau);
    let media = build_media(&listing.listing_id, search_item, &d);
    (company, listing, media)
}

fn transform_company(org_data: &Value, org_detail: &Value) -> CompanyRecord {
    let vestigingsadres = org_detail
        .get("vestigingsadres")
        .or_else(|| org_data.get("vestigingsadres"))
        .cloned()
        .unwrap_or_else(empty_object);
    let company_id = get_string(org_detail, &["id"]).or_else(|| get_string(org_data, &["id"])).unwrap_or_default();
    let email = get_string(org_detail, &["emailadres"]).filter(|v| !v.is_empty());
    let phone = get_string(org_detail, &["telefoonnummer"]).filter(|v| !v.is_empty());
    let website = get_string(org_detail, &["website"])
        .or_else(|| get_string(org_data, &["website"]))
        .filter(|v| !v.is_empty());

    CompanyRecord {
        company_id,
        name: get_string(org_detail, &["naam"]).or_else(|| get_string(org_data, &["naam"])).unwrap_or_default(),
        slug: None,
        logo_url: get_string(org_detail, &["logoUrl"]).or_else(|| get_string(org_data, &["logoUrl"])),
        website,
        contact_email: email,
        contact_phone: phone,
        address_street: get_string(&vestigingsadres, &["straat"]),
        address_house_number: get_string(&vestigingsadres, &["huisnummer"]),
        address_zipcode: get_string(&vestigingsadres, &["postcode"]),
        address_city: get_string(&vestigingsadres, &["plaats"]),
        address_province: None,
        address_country: get_string(&vestigingsadres, &["land", "code"]).or(Some("NL".to_string())),
        company_type: Some("direct_employer".to_string()),
        size: get_string(org_detail, &["bedrijfsgrootte"]),
        industries: json!([]),
        description: get_string(org_detail, &["omschrijving"]),
        metadata: json!({
            "leerbedrijf_id": get_string(org_detail, &["leerbedrijfId"]).or_else(|| get_string(org_data, &["leerbedrijfId"]))
        }),
        source_platform: "stagemarkt.nl".to_string(),
    }
}

fn build_listing(search_item: &Value, d: &Value, niveau: i32) -> ListingRecord {
    let adres = d.get("adres").or_else(|| search_item.get("adres")).cloned().unwrap_or_else(empty_object);
    let kwalificatie = d.get("kwalificatie").or_else(|| search_item.get("kwalificatie")).cloned().unwrap_or_else(empty_object);
    let vergoedingen = d.get("vergoedingen").or_else(|| search_item.get("vergoedingen")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
    let org_data = search_item.get("organisatie").cloned().unwrap_or_else(empty_object);
    let company_id = get_string(d, &["organisatie", "id"]).or_else(|| get_string(&org_data, &["id"])).unwrap_or_default();
    let leerweg = get_string(d, &["leerweg"]).or_else(|| get_string(search_item, &["leerweg"])).unwrap_or_default();
    let contract_type = if leerweg == "BBL" || leerweg == "BOL" { leerweg.clone() } else { "Stage".to_string() };
    let listing_id = get_string(search_item, &["leerplaatsId"]).or_else(|| get_string(d, &["id"])).unwrap_or_default();
    let listing_url = format!("https://stagemarkt.nl/leerplaats/{listing_id}");
    let allowances: Vec<String> = vergoedingen
        .iter()
        .filter_map(|v| v.get("omschrijving").and_then(|s| s.as_str()).map(|s| s.to_string()))
        .collect();
    let education_levels = parse_education_level(get_string(&kwalificatie, &["niveaunaam"]).unwrap_or_default(), niveau);
    let kerntaken = d.get("kerntaken").and_then(|v| v.as_array()).cloned().unwrap_or_default();
    let mut kerntaken_list = Vec::new();
    for kt in kerntaken.iter() {
        let task_name = get_string(kt, &["naam"]).unwrap_or_default();
        let subtaken = kt.get("subtaken").and_then(|v| v.as_array()).cloned().unwrap_or_default();
        let subtask_names: Vec<String> = subtaken
            .iter()
            .filter(|st| st.get("uitvoerbaar").and_then(|v| v.as_bool()).unwrap_or(false))
            .filter_map(|st| get_string(st, &["naam"]))
            .collect();
        if !subtask_names.is_empty() {
            kerntaken_list.push(format!("{}: {}", task_name, subtask_names.join("; ")));
        } else if !task_name.is_empty() {
            kerntaken_list.push(task_name);
        }
    }
    let dagen_per_week_raw = get_string(d, &["dagenPerWeek"]).or_else(|| get_string(search_item, &["dagenPerWeek"]));

    let street = get_string(&adres, &["straat"]);
    let house = get_string(&adres, &["huisnummer"]);
    let street_full = match (street, house) {
        (Some(s), Some(h)) if !h.is_empty() => Some(format!("{} {}", s, h)),
        (Some(s), _) => Some(s),
        _ => None,
    };
    let location_text = join_location(vec![
        street_full,
        get_string(&adres, &["postcode"]),
        get_string(&adres, &["plaats"]),
        get_string(&adres, &["land", "code"]).or(Some("NL".to_string())),
    ]);

    ListingRecord {
        listing_id: listing_id.clone(),
        company_id,
        title: get_string(d, &["titel"]).or_else(|| get_string(search_item, &["titel"])).unwrap_or_default(),
        catchy_title: get_string(d, &["wervendeTitel"]).or_else(|| get_string(search_item, &["wervendeTitel"])),
        description: get_string(d, &["omschrijving"]),
        requirements: get_string(d, &["vaardigheden"]),
        education_level: json!(education_levels),
        contract_type: Some(contract_type),
        location_text,
        location_latitude: get_f64(&adres, &["coordinaten", "lat"]),
        location_longitude: get_f64(&adres, &["coordinaten", "lon"]),
        start_date: get_string(d, &["startdatum"]).or_else(|| get_string(search_item, &["startdatum"])),
        end_date: get_string(d, &["einddatum"]),
        compensation_amount_min: get_f64(d, &["bedragVan"]).or_else(|| get_f64(search_item, &["bedragVan"])),
        compensation_amount_max: get_f64(d, &["bedragTot"]).or_else(|| get_f64(search_item, &["bedragTot"])),
        compensation_currency: Some("EUR".to_string()),
        compensation_allowances: json!(allowances),
        skills: json!(get_string(d, &["vaardigheden"]).map(|v| vec![v]).unwrap_or_default()),
        application_method: Some("external".to_string()),
        application_url: get_string(d, &["website"]).or(Some(listing_url.clone())),
        application_email: get_string(d, &["emailadres"]),
        source_platform: "stagemarkt.nl".to_string(),
        source_original_id: Some(listing_id.clone()),
        source_url: Some(listing_url),
        metadata: json!({
            "aantal_plekken": get_i32(d, &["aantal"]),
            "leerweg": leerweg,
            "kwalificatie": {
            "niveau_naam": get_string(&kwalificatie, &["niveaunaam"]),
            "crebo_code": get_string(&kwalificatie, &["crebocode"])
            },
            "kenmerken": search_item.get("kenmerken").cloned().unwrap_or_else(empty_array),
            "kerntaken": kerntaken_list,
            "contactpersoon": get_string(d, &["contactpersoon"]),
            "aanbieden": get_string(d, &["aanbieden"]),
            "dagen_per_week_original": dagen_per_week_raw
        }),
    }
}

fn build_media(listing_id: &str, search_item: &Value, d: &Value) -> Vec<MediaRecord> {
    let mut media = Vec::new();
    if let Some(arr) = search_item.get("afbeeldingen").and_then(|v| v.as_array()) {
        for img in arr.iter() {
            if let Some(url) = img.get("url").and_then(|v| v.as_str()) {
                media.push(MediaRecord {
                    listing_id: listing_id.to_string(),
                    sequence: media.len() as i32,
                    media_type: "image".to_string(),
                    url: Some(url.to_string()),
                    embed_code: None,
                });
            }
        }
    }
    if let Some(arr) = d.get("media").and_then(|v| v.as_array()) {
        for m in arr.iter() {
            let media_type = get_string(m, &["type"]).unwrap_or_default().to_uppercase();
            if media_type.contains("IMAGE") {
                if let Some(url) = m.get("url").and_then(|v| v.as_str()) {
                    media.push(MediaRecord {
                        listing_id: listing_id.to_string(),
                        sequence: media.len() as i32,
                        media_type: "image".to_string(),
                        url: Some(url.to_string()),
                        embed_code: None,
                    });
                }
            } else if media_type.contains("MOVIE") || media_type.contains("VIDEO") {
                if let Some(url) = m.get("url").and_then(|v| v.as_str()) {
                    media.push(MediaRecord {
                        listing_id: listing_id.to_string(),
                        sequence: media.len() as i32,
                        media_type: "video".to_string(),
                        url: Some(url.to_string()),
                        embed_code: get_string(m, &["embedCode"]),
                    });
                }
            }
        }
    }
    media
}

fn parse_education_level(niveau_naam: String, niveau: i32) -> Vec<String> {
    if niveau_naam.is_empty() {
        return vec![format!("MBO-{}", niveau)];
    }
    if niveau_naam.contains("Niveau 1") {
        vec!["MBO-1".to_string()]
    } else if niveau_naam.contains("Niveau 2") {
        vec!["MBO-2".to_string()]
    } else if niveau_naam.contains("Niveau 3") {
        vec!["MBO-3".to_string()]
    } else if niveau_naam.contains("Niveau 4") {
        vec!["MBO-4".to_string()]
    } else {
        vec![format!("MBO-{}", niveau)]
    }
}
