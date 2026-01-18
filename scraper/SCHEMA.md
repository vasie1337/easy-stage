# Internship Database Schema

Unified schema for internships from multiple platforms (Stagemarkt, NVB, etc.)

## Table: `internships`

| Column | Type | Description |
| ------ | ---- | ----------- |
| `id` | TEXT | Primary key (platform-specific ID) |
| `source` | TEXT | Platform source (`stagemarkt`, `nvb`, etc.) |
| `title` | TEXT | Internship title |
| `description` | TEXT | Full description |
| `media` | JSONB | Array of media URLs |
| `company_name` | TEXT | Company name |
| `company_site` | TEXT | Company website |
| `company_logo` | TEXT | Company logo URL |
| `apply_option` | TEXT | How to apply (`link`, `email`) |
| `apply_value` | TEXT | URL or email address |
| `location_street` | TEXT | Street + number |
| `location_zip` | TEXT | Postal code |
| `location_city` | TEXT | City |
| `location_province` | TEXT | Province |
| `location_country` | TEXT | Country code (default: `NL`) |
| `location_lat` | REAL | Latitude |
| `location_lon` | REAL | Longitude |
| `level` | TEXT | Education level (`mbo1`-`mbo4`, `hbo`, etc.) |
| `sublevel` | TEXT | Sub-classification (e.g., CREBO code) |
| `keywords` | JSONB | Extracted keywords array |
| `start_date` | TEXT | Start date (ISO format) |
| `end_date` | TEXT | End date (ISO format) |
| `raw_json` | JSONB | Complete raw API response |
| `created_at` | TIMESTAMP | When first scraped |
| `updated_at` | TIMESTAMP | When last updated |

## Unified JSON Format

```json
{
  "id": "uuid",
  "source": "stagemarkt",
  "title": "Stage Finance",
  "description": "...",
  "media": [],
  
  "company": {
    "name": "Cavallaro Napoli",
    "site": "https://...",
    "logo": null
  },
  
  "apply": {
    "option": "link",
    "value": "https://..."
  },
  
  "location": {
    "street": "Nieuwe Groenmarkt 1",
    "zip": "2011TW",
    "city": "Haarlem",
    "province": "Noord-Holland",
    "country": "NL",
    "coords": { "lat": 52.381226, "lon": 4.636206 }
  },
  
  "level": "hbo",
  "sublevel": null,
  "keywords": ["finance", "administratie", "facturatie"]
}
```

## Keyword Extraction

| Source | Fields |
| ------ | ------ |
| Stagemarkt | `kerntaken[].naam` + `kwalificatie.naam` + `vaardigheden` |
| NVB | `dcoTitles[].title` + `industries` + `jobTitles` |

## Meilisearch Config

```javascript
{
  searchableAttributes: ["title", "description", "keywords", "company_name", "location_city"],
  filterableAttributes: ["level", "sublevel", "location_province", "location_city", "source"],
  sortableAttributes: ["start_date", "updated_at"],
  rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"]
}
```

## Example Queries

```sql
-- Count by platform
SELECT source, COUNT(*) FROM internships GROUP BY source;

-- Find HBO internships in Amsterdam
SELECT title, company_name FROM internships 
WHERE level = 'hbo' AND location_city = 'Amsterdam';

-- Search keywords
SELECT * FROM internships 
WHERE keywords @> '["finance"]';

-- Recent additions
SELECT * FROM internships 
ORDER BY created_at DESC LIMIT 10;
```

## Adding a New Platform

1. Create `scraper/{platform}.py`
2. Implement:
   - `SOURCE = "{platform}"`
   - `extract_keywords(raw)` - extract keywords from raw API data
   - `normalize(raw)` - transform API response to unified schema
   - `fetch_all_ids(client)` - get all IDs from search API
   - `fetch_detail(client, sem, id)` - get details for one ID
   - `scrape()` - main function
3. Add import to `main.py`
4. Rebuild: `docker compose build scraper`
