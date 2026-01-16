use anyhow::Result;
use reqwest::header::{HeaderMap, HeaderValue, ORIGIN, REFERER};
use serde_json::{json, Value};

use crate::config::Config;
use crate::db::Database;
use crate::http;
use crate::models::{CompanyRecord, ListingRecord, MediaRecord};
use crate::scrapers::{empty_array, empty_object, get_f64, get_string, join_location};

const BASE_URL: &str = "https://api.nationalevacaturebank.nl/api/jobs/v3/sites/nationalevacaturebank.nl/jobs";
const DETAIL_URL_TEMPLATE: &str = "https://www.nationalevacaturebank.nl/vacature/{listing_id}/{slug}";
const DEFAULT_LIMIT: i32 = 9999;
const PAGE_LIMIT: i32 = 100;

pub async fn run(db: Database, config: Config) -> Result<()> {
    run_inner(db, config).await
}

async fn run_inner(db: Database, config: Config) -> Result<()> {
    tracing::info!("nvb start");
    let mut headers = HeaderMap::new();
    headers.insert(ORIGIN, HeaderValue::from_static("https://www.nationalevacaturebank.nl"));
    headers.insert(REFERER, HeaderValue::from_static("https://www.nationalevacaturebank.nl/"));
    let client = http::build_client_with_headers(config.proxy.as_deref(), headers)?;

    let mut page = 1;
    let mut total_listings = 0usize;
    let mut total_companies = 0usize;
    loop {
        tracing::info!("nvb fetching page {}", page);
        let params = vec![
            ("page", page.to_string()),
            ("limit", DEFAULT_LIMIT.to_string()),
            ("filters", "contractType:Stage".to_string()),
        ];
        let data = match http::get_json_with_retries(&client, BASE_URL, &params, 5).await {
            Ok(Some(v)) => v,
            Ok(None) => break,
            Err(e) => {
                return Err(e);
            }
        };
        
        let jobs = data
            .get("_embedded")
            .and_then(|v| v.get("jobs"))
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        if jobs.is_empty() {
            break;
        }
        for job in jobs.iter() {
            let company = transform_company(job);
            if let Err(e) = db.upsert_company(&company).await {
                tracing::error!("nvb db error: {}", e);
                continue;
            }
            total_companies += 1;
            let (listing, media) = transform_listing(job);
            if let Err(e) = db.upsert_listing(&listing).await {
                tracing::error!("nvb db error: {}", e);
                continue;
            }
            if let Err(e) = db.upsert_media(&listing.listing_id, media).await {
                tracing::error!("nvb db error: {}", e);
            }
            total_listings += 1;
        }
        tracing::info!("nvb page {} done: listings {}", page, jobs.len());
        if page >= PAGE_LIMIT {
            break;
        }
        let total_pages = data.get("pages").and_then(|v| v.as_i64()).unwrap_or(0);
        if total_pages > 0 && page >= total_pages as i32 {
            break;
        }
        page += 1;
    }
    
    tracing::info!("nvb done: companies {} listings {}", total_companies, total_listings);
    Ok(())
}

fn transform_company(job: &Value) -> CompanyRecord {
    let company_data = job.get("company").cloned().unwrap_or_else(empty_object);
    let contact = job.get("contact").cloned().unwrap_or_else(empty_object);
    let work_location = job.get("workLocation").cloned().unwrap_or_else(empty_object);

    let company_slug = get_string(&company_data, &["slug"]).unwrap_or_default();
    let company_name = get_string(&company_data, &["name"]).unwrap_or_else(|| "Unknown".to_string());
    let company_id = if company_slug.is_empty() {
        company_name.to_lowercase().replace(' ', "-")
    } else {
        company_slug.clone()
    };

    let logo_url = job
        .get("logos")
        .and_then(|v| v.get("1000x1000"))
        .and_then(|v| v.as_str())
        .map(|v| v.to_string());

    let website = get_string(&company_data, &["website"])
        .or_else(|| get_string(&contact, &["website"]))
        .filter(|v| !v.is_empty());

    let email = get_string(&contact, &["emailAddress"]).filter(|v| !v.is_empty());
    let phone = get_string(&contact, &["phoneNumber"]).filter(|v| !v.is_empty());

    CompanyRecord {
        company_id,
        name: company_name,
        slug: if company_slug.is_empty() { None } else { Some(company_slug) },
        logo_url,
        website,
        contact_email: email,
        contact_phone: phone,
        address_street: get_string(&contact, &["street"]),
        address_house_number: None,
        address_zipcode: get_string(&contact, &["zipcode"]),
        address_city: get_string(&contact, &["city"]),
        address_province: get_string(&work_location, &["province"]),
        address_country: Some("NL".to_string()),
        company_type: get_string(&company_data, &["type"]).or(Some("direct_employer".to_string())),
        size: None,
        industries: job.get("industries").cloned().unwrap_or_else(empty_array),
        description: None,
        metadata: json!({
            "recruiter_id": get_string(job, &["recruiterId"]),
            "origin": get_string(job, &["origin"])
        }),
        source_platform: "nationalevacaturebank.nl".to_string(),
    }
}

fn transform_listing(job: &Value) -> (ListingRecord, Vec<MediaRecord>) {
    let work_location = job.get("workLocation").cloned().unwrap_or_else(empty_object);
    let apply_info = job.get("apply").cloned().unwrap_or_else(empty_object);
    let contact_info = job.get("contact").cloned().unwrap_or_else(empty_object);

    let listing_id = get_string(job, &["id"]).unwrap_or_default();
    let slug = get_string(job, &["functionTitleSlug"]).unwrap_or_default();
    let detail_url = DETAIL_URL_TEMPLATE
        .replace("{listing_id}", &listing_id)
        .replace("{slug}", &slug);

    let company_slug = get_string(job, &["company", "slug"]).unwrap_or_default();
    let company_name = get_string(job, &["company", "name"]).unwrap_or_else(|| "Unknown".to_string());
    let company_id = if company_slug.is_empty() {
        company_name.to_lowercase().replace(' ', "-")
    } else {
        company_slug.clone()
    };

    let media = build_media(job, &listing_id);
    let apply_info_ref = &apply_info;
    let contact_info_ref = &contact_info;

    let education_levels = job.get("educationLevels").cloned().unwrap_or_else(empty_array);
    let location_text = join_location(vec![
        get_string(&work_location, &["street"]),
        get_string(&work_location, &["zipCode"]),
        get_string(&work_location, &["city"]),
        get_string(&work_location, &["province"]),
        get_string(&work_location, &["country", "iso"]),
        get_string(&work_location, &["displayName"]),
    ]);

    let listing = ListingRecord {
        listing_id: listing_id.clone(),
        company_id,
        title: get_string(job, &["title"])
            .or_else(|| get_string(job, &["functionTitle"]))
            .unwrap_or_default(),
        catchy_title: None,
        description: get_string(job, &["description"]),
        requirements: get_string(job, &["requirements"]),
        education_level: normalize_education_levels(&education_levels),
        contract_type: get_string(job, &["contractType"]).or(Some("Stage".to_string())),
        location_text,
        location_latitude: get_f64(&work_location, &["geolocation", "latitude"]),
        location_longitude: get_f64(&work_location, &["geolocation", "longitude"]),
        start_date: get_string(job, &["startDate"]),
        end_date: get_string(job, &["endDate"]),
        compensation_amount_min: get_f64(job, &["salary", "min"]),
        compensation_amount_max: get_f64(job, &["salary", "max"]),
        compensation_currency: Some("EUR".to_string()),
        compensation_allowances: json!([]),
        skills: job.get("jobTitles").cloned().unwrap_or_else(empty_array),
        application_method: get_string(apply_info_ref, &["option"]).or(Some("external".to_string())),
        application_url: get_string(apply_info_ref, &["url"]),
        application_email: get_string(contact_info_ref, &["emailAddress"]),
        source_platform: "nationalevacaturebank.nl".to_string(),
        source_original_id: get_string(job, &["referenceId"]),
        source_url: Some(detail_url),
        metadata: json!({
            "career_level": get_string(job, &["careerLevel"]),
            "dco_title": get_string(job, &["dcoTitle"]),
            "dco_titles": job.get("dcoTitles").cloned().unwrap_or_else(empty_array),
            "number_of_applies": get_string(job, &["numberOfApplies"]),
            "is_pbp": get_string(job, &["isPbp"]),
            "display_options": job.get("displayOptions").cloned().unwrap_or_else(empty_array),
            "status": get_string(job, &["status"]),
            "metadata": job.get("metadata").cloned().unwrap_or_else(empty_object)
        }),
    };

    (listing, media)
}

fn build_media(job: &Value, listing_id: &str) -> Vec<MediaRecord> {
    let mut media = Vec::new();
    if let Some(logo) = job.get("logos").and_then(|v| v.get("1000x1000")).and_then(|v| v.as_str()) {
        media.push(MediaRecord {
            listing_id: listing_id.to_string(),
            sequence: 0,
            media_type: "image".to_string(),
            url: Some(logo.to_string()),
            embed_code: None,
        });
    }
    if let Some(video) = job.get("video").and_then(|v| v.as_str()) {
        media.push(MediaRecord {
            listing_id: listing_id.to_string(),
            sequence: media.len() as i32,
            media_type: "video".to_string(),
            url: Some(video.to_string()),
            embed_code: None,
        });
    }
    media
}

fn normalize_education_levels(levels: &Value) -> Value {
    let arr = levels.as_array().cloned().unwrap_or_default();
    let mapped: Vec<String> = arr
        .iter()
        .filter_map(|v| v.as_str())
        .map(|level| match level {
            "MBO" => "MBO-4".to_string(),
            "HBO" => "HBO".to_string(),
            "WO" => "WO".to_string(),
            "VMBO" => "MBO-1".to_string(),
            _ => level.to_string(),
        })
        .collect();
    json!(mapped)
}
