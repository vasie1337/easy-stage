import os
import json
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://stagemarkt:stagemarkt@localhost:5432/stagemarkt")


def get_connection():
    print(DATABASE_URL)
    return psycopg2.connect(DATABASE_URL)


def setup_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS internships (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            
            title TEXT,
            description TEXT,
            media JSONB DEFAULT '[]',
            
            company_name TEXT,
            company_site TEXT,
            company_logo TEXT,
            
            apply_option TEXT,
            apply_value TEXT,
            
            location_street TEXT,
            location_zip TEXT,
            location_city TEXT,
            location_province TEXT,
            location_country TEXT DEFAULT 'NL',
            location_lat REAL,
            location_lon REAL,
            
            level TEXT,
            sublevel TEXT,
            keywords JSONB DEFAULT '[]',
            
            start_date TEXT,
            end_date TEXT,
            
            raw_json JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_source ON internships(source)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_level ON internships(level)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_city ON internships(location_city)")
    conn.commit()
    return conn


def get_existing_ids(conn, source):
    """Get all IDs for a specific source"""
    cur = conn.cursor()
    cur.execute("SELECT id FROM internships WHERE source = %s", (source,))
    return set(row[0] for row in cur.fetchall())


def delete_ids(conn, source, ids):
    """Delete IDs that no longer exist for a source"""
    if not ids:
        return
    cur = conn.cursor()
    cur.execute("DELETE FROM internships WHERE source = %s AND id = ANY(%s)", (source, list(ids)))
    conn.commit()


def save_internship(conn, data):
    """Save/update an internship"""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO internships (
            id, source, title, description, media,
            company_name, company_site, company_logo,
            apply_option, apply_value,
            location_street, location_zip, location_city, location_province, location_country, location_lat, location_lon,
            level, sublevel, keywords,
            start_date, end_date, raw_json, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            media = EXCLUDED.media,
            company_name = EXCLUDED.company_name,
            company_site = EXCLUDED.company_site,
            company_logo = EXCLUDED.company_logo,
            apply_option = EXCLUDED.apply_option,
            apply_value = EXCLUDED.apply_value,
            location_street = EXCLUDED.location_street,
            location_zip = EXCLUDED.location_zip,
            location_city = EXCLUDED.location_city,
            location_province = EXCLUDED.location_province,
            location_lat = EXCLUDED.location_lat,
            location_lon = EXCLUDED.location_lon,
            level = EXCLUDED.level,
            sublevel = EXCLUDED.sublevel,
            keywords = EXCLUDED.keywords,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            raw_json = EXCLUDED.raw_json,
            updated_at = NOW()
    """, (
        data["id"],
        data["source"],
        data.get("title"),
        data.get("description"),
        json.dumps(data.get("media") or []),
        (data.get("company") or {}).get("name"),
        (data.get("company") or {}).get("site"),
        (data.get("company") or {}).get("logo"),
        (data.get("apply") or {}).get("option"),
        (data.get("apply") or {}).get("value"),
        (data.get("location") or {}).get("street"),
        (data.get("location") or {}).get("zip"),
        (data.get("location") or {}).get("city"),
        (data.get("location") or {}).get("province"),
        (data.get("location") or {}).get("country", "NL"),
        ((data.get("location") or {}).get("coords") or {}).get("lat"),
        ((data.get("location") or {}).get("coords") or {}).get("lon"),
        data.get("level"),
        data.get("sublevel"),
        json.dumps(data.get("keywords") or []),
        data.get("start_date"),
        data.get("end_date"),
        json.dumps(data.get("raw") or {})
    ))
