use anyhow::Result;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::models::{CompanyRecord, ListingRecord, MediaRecord};

#[derive(Clone)]
pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str, max_connections: u32) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    pub async fn init(&self) -> Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                company_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                slug TEXT,
                logo_url TEXT,
                website TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                address_street TEXT,
                address_house_number TEXT,
                address_zipcode TEXT,
                address_city TEXT,
                address_province TEXT,
                address_country TEXT,
                type TEXT,
                size TEXT,
                industries JSONB,
                description TEXT,
                metadata JSONB,
                source_platform TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                listing_id TEXT UNIQUE NOT NULL,
                company_id TEXT NOT NULL,
                title TEXT NOT NULL,
                catchy_title TEXT,
                description TEXT,
                requirements TEXT,
                education_level JSONB,
                contract_type TEXT,
                location_text TEXT,
                location_latitude DOUBLE PRECISION,
                location_longitude DOUBLE PRECISION,
                start_date TEXT,
                end_date TEXT,
                compensation_amount_min DOUBLE PRECISION,
                compensation_amount_max DOUBLE PRECISION,
                compensation_currency TEXT,
                compensation_allowances JSONB,
                skills JSONB,
                application_method TEXT,
                application_url TEXT,
                application_email TEXT,
                source_platform TEXT NOT NULL,
                source_original_id TEXT,
                source_url TEXT,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                scraped_at TIMESTAMPTZ DEFAULT NOW()
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query("ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_text TEXT")
            .execute(&self.pool)
            .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS media (
                id SERIAL PRIMARY KEY,
                listing_id TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                type TEXT NOT NULL,
                url TEXT,
                embed_code TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(listing_id, sequence)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_listings_company_id ON listings(company_id)")
            .execute(&self.pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_listings_platform ON listings(source_platform)")
            .execute(&self.pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_listings_scraped_at ON listings(scraped_at)")
            .execute(&self.pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_media_listing_id ON media(listing_id)")
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn upsert_company(&self, c: &CompanyRecord) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO companies (
                company_id, name, slug, logo_url, website, contact_email, contact_phone,
                address_street, address_house_number, address_zipcode, address_city,
                address_province, address_country, type, size, industries, description,
                metadata, source_platform
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
            )
            ON CONFLICT (company_id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                logo_url = EXCLUDED.logo_url,
                website = EXCLUDED.website,
                contact_email = EXCLUDED.contact_email,
                contact_phone = EXCLUDED.contact_phone,
                address_street = EXCLUDED.address_street,
                address_house_number = EXCLUDED.address_house_number,
                address_zipcode = EXCLUDED.address_zipcode,
                address_city = EXCLUDED.address_city,
                address_province = EXCLUDED.address_province,
                address_country = EXCLUDED.address_country,
                type = EXCLUDED.type,
                size = EXCLUDED.size,
                industries = EXCLUDED.industries,
                description = EXCLUDED.description,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            "#,
        )
        .bind(&c.company_id)
        .bind(&c.name)
        .bind(&c.slug)
        .bind(&c.logo_url)
        .bind(&c.website)
        .bind(&c.contact_email)
        .bind(&c.contact_phone)
        .bind(&c.address_street)
        .bind(&c.address_house_number)
        .bind(&c.address_zipcode)
        .bind(&c.address_city)
        .bind(&c.address_province)
        .bind(&c.address_country)
        .bind(&c.company_type)
        .bind(&c.size)
        .bind(&c.industries.clone())
        .bind(&c.description)
        .bind(&c.metadata.clone())
        .bind(&c.source_platform)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn upsert_listing(&self, l: &ListingRecord) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO listings (
                listing_id, company_id, title, catchy_title, description,
                requirements, education_level, contract_type, location_text,
                location_latitude, location_longitude, start_date, end_date,
                compensation_amount_min, compensation_amount_max, compensation_currency,
                compensation_allowances, skills, application_method, application_url,
                application_email, source_platform, source_original_id, source_url,
                metadata, scraped_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
                $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW()
            )
            ON CONFLICT (listing_id) DO UPDATE SET
                company_id = EXCLUDED.company_id,
                title = EXCLUDED.title,
                catchy_title = EXCLUDED.catchy_title,
                description = EXCLUDED.description,
                requirements = EXCLUDED.requirements,
                education_level = EXCLUDED.education_level,
                contract_type = EXCLUDED.contract_type,
                location_text = EXCLUDED.location_text,
                location_latitude = EXCLUDED.location_latitude,
                location_longitude = EXCLUDED.location_longitude,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                compensation_amount_min = EXCLUDED.compensation_amount_min,
                compensation_amount_max = EXCLUDED.compensation_amount_max,
                compensation_currency = EXCLUDED.compensation_currency,
                compensation_allowances = EXCLUDED.compensation_allowances,
                skills = EXCLUDED.skills,
                application_method = EXCLUDED.application_method,
                application_url = EXCLUDED.application_url,
                application_email = EXCLUDED.application_email,
                source_platform = EXCLUDED.source_platform,
                source_original_id = EXCLUDED.source_original_id,
                source_url = EXCLUDED.source_url,
                metadata = EXCLUDED.metadata,
                updated_at = NOW(),
                scraped_at = NOW()
            "#,
        )
        .bind(&l.listing_id)           // $1
        .bind(&l.company_id)           // $2
        .bind(&l.title)                // $3
        .bind(&l.catchy_title)         // $4
        .bind(&l.description)          // $5
        .bind(&l.requirements)         // $6
        .bind(&l.education_level)      // $7
        .bind(&l.contract_type)        // $8
        .bind(&l.location_text)        // $9
        .bind(&l.location_latitude)    // $10
        .bind(&l.location_longitude)   // $11
        .bind(&l.start_date)           // $12
        .bind(&l.end_date)             // $13
        .bind(&l.compensation_amount_min)   // $14
        .bind(&l.compensation_amount_max)   // $15
        .bind(&l.compensation_currency)     // $16
        .bind(&l.compensation_allowances)   // $17
        .bind(&l.skills)               // $18
        .bind(&l.application_method)   // $19
        .bind(&l.application_url)      // $20
        .bind(&l.application_email)    // $21
        .bind(&l.source_platform)      // $22
        .bind(&l.source_original_id)   // $23
        .bind(&l.source_url)           // $24
        .bind(&l.metadata)             // $25
        .execute(&self.pool)
        .await?;
    
        Ok(())
    }

    pub async fn upsert_media(&self, listing_id: &str, media: Vec<MediaRecord>) -> Result<()> {
        if media.is_empty() {
            sqlx::query("DELETE FROM media WHERE listing_id = $1")
                .bind(listing_id)
                .execute(&self.pool)
                .await?;
            return Ok(());
        }

        for m in media.iter() {
            sqlx::query(
                r#"
                INSERT INTO media (listing_id, sequence, type, url, embed_code)
                VALUES ($1,$2,$3,$4,$5)
                ON CONFLICT (listing_id, sequence) DO UPDATE SET
                    type = EXCLUDED.type,
                    url = EXCLUDED.url,
                    embed_code = EXCLUDED.embed_code
                "#,
            )
            .bind(&m.listing_id)
            .bind(m.sequence)
            .bind(&m.media_type)
            .bind(&m.url)
            .bind(&m.embed_code)
            .execute(&self.pool)
            .await?;
        }

        sqlx::query("DELETE FROM media WHERE listing_id = $1 AND sequence >= $2")
            .bind(listing_id)
            .bind(media.len() as i32)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
