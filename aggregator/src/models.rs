use serde_json::Value;

#[derive(Clone)]
pub struct CompanyRecord {
    pub company_id: String,
    pub name: String,
    pub slug: Option<String>,
    pub logo_url: Option<String>,
    pub website: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub address_street: Option<String>,
    pub address_house_number: Option<String>,
    pub address_zipcode: Option<String>,
    pub address_city: Option<String>,
    pub address_province: Option<String>,
    pub address_country: Option<String>,
    pub company_type: Option<String>,
    pub size: Option<String>,
    pub industries: Value,
    pub description: Option<String>,
    pub metadata: Value,
    pub source_platform: String,
}

#[derive(Clone)]
pub struct ListingRecord {
    pub listing_id: String,
    pub company_id: String,
    pub title: String,
    pub catchy_title: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub education_level: Value,
    pub contract_type: Option<String>,
    pub location_text: Option<String>,
    pub location_latitude: Option<f64>,
    pub location_longitude: Option<f64>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub compensation_amount_min: Option<f64>,
    pub compensation_amount_max: Option<f64>,
    pub compensation_currency: Option<String>,
    pub compensation_allowances: Value,
    pub skills: Value,
    pub application_method: Option<String>,
    pub application_url: Option<String>,
    pub application_email: Option<String>,
    pub source_platform: String,
    pub source_original_id: Option<String>,
    pub source_url: Option<String>,
    pub metadata: Value,
}

#[derive(Clone)]
pub struct MediaRecord {
    pub listing_id: String,
    pub sequence: i32,
    pub media_type: String,
    pub url: Option<String>,
    pub embed_code: Option<String>,
}
