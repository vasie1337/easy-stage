"""
Nationale Vacaturebank scraper
Scrapes internships from nationalevacaturebank.nl and normalizes to unified schema
"""
import os
import re
import json
import asyncio
import rnet
from db import setup_db, get_existing_ids, delete_ids, save_internship


def clean_html(html):
    """Convert HTML to plain text"""
    if not html:
        return None
    
    # Replace common block elements with newlines
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'</h[1-6]>', '\n\n', text)
    
    # Add bullet points for list items
    text = re.sub(r'<li[^>]*>', '• ', text)
    
    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Decode HTML entities
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    text = text.replace('&apos;', "'")
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&euml;', 'ë')
    text = text.replace('&eacute;', 'é')
    text = text.replace('&egrave;', 'è')
    text = text.replace('&ouml;', 'ö')
    text = text.replace('&uuml;', 'ü')
    text = text.replace('&ccedil;', 'ç')
    
    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)  # Max 2 newlines
    text = re.sub(r' +', ' ', text)  # Multiple spaces to single
    text = '\n'.join(line.strip() for line in text.split('\n'))  # Strip each line
    text = text.strip()
    
    return text

SOURCE = "nvb"
PROXY = os.environ.get("PROXY")
CONCURRENCY = 50

# API endpoint
BASE_URL = "https://api.nationalevacaturebank.nl/api/jobs/v3/sites/nationalevacaturebank.nl/jobs"
SEARCH_URL = f"{BASE_URL}?limit=1000&sort=date&filters=contractType%3AStage"

# Education level mapping
LEVEL_MAP = {
    "MBO": "mbo",
    "HBO": "hbo",
    "WO": "wo",
    "Middelbaar": "vmbo",
    "Basisonderwijs": "basis",
}


def extract_keywords(raw):
    """Extract keywords from NVB data"""
    keywords = set()
    
    # From dcoTitles
    for dco in raw.get("dcoTitles") or []:
        if dco.get("title"):
            keywords.add(dco["title"].lower())
    
    # From industries
    for ind in raw.get("industries") or []:
        keywords.add(ind.lower())
    
    # From jobTitles
    for jt in raw.get("jobTitles") or []:
        keywords.add(jt.lower())
    
    # From categories
    for cat in raw.get("categories") or []:
        keywords.add(cat.lower())
    
    # From functionTitle
    if raw.get("functionTitle"):
        keywords.add(raw["functionTitle"].lower())
    
    return [k for k in keywords if k and len(k) > 2]


def normalize(raw):
    """Transform NVB API response to unified schema"""
    company = raw.get("company") or {}
    apply_data = raw.get("apply") or {}
    contact_data = raw.get("contact") or {}
    loc = raw.get("workLocation") or {}
    geo = loc.get("geolocation") or {}
    
    # Map education level
    level = None
    for edu in raw.get("educationLevels") or []:
        if edu in LEVEL_MAP:
            level = LEVEL_MAP[edu]
            break
    
    return {
        "id": raw.get("id"),
        "source": SOURCE,
        "title": raw.get("title") or raw.get("functionTitle"),
        "description": clean_html(raw.get("description")),
        "media": [],
        
        "company": {
            "name": company.get("name"),
            "site": company.get("website"),
            "logo": None,
        },
        
        "apply": {
            "option": "email" if contact_data.get("emailAddress") else ("link" if apply_data.get("option") == "external" else "email"),
            "value": contact_data.get("emailAddress") or apply_data.get("url") or apply_data.get("email"),
        },
        
        "location": {
            "street": loc.get("street"),
            "zip": loc.get("zipCode"),
            "city": loc.get("city"),
            "province": loc.get("province"),
            "country": "NL",
            "coords": {
                "lat": float(geo["latitude"]) if geo.get("latitude") else None,
                "lon": float(geo["longitude"]) if geo.get("longitude") else None,
            } if geo else None,
        },
        
        "level": level,
        "sublevel": (raw.get("metadata") or {}).get("isco"),
        "keywords": extract_keywords(raw),
        
        "start_date": raw.get("startDate"),
        "end_date": raw.get("endDate"),
        
        "raw": raw,
    }


# ============ API FETCHERS ============

async def fetch_with_retry(client, url, max_retries=10):
    delay = 1
    for attempt in range(max_retries):
        try:
            resp = await client.get(url)
            text = await resp.text()
            if not text or not text.strip():
                raise ValueError("Empty response")
            return json.loads(text)
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"  Failed after {max_retries} attempts: {url}")
                raise
            # Debug: show what we actually got
            if attempt == 0:
                try:
                    preview = text[:200] if text else "(empty)"
                    print(f"  Response preview: {preview}")
                except:
                    pass
            print(f"  Retry {attempt + 1}/{max_retries} (waiting {delay}s): {e}")
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)  # Exponential backoff, max 30s


async def fetch_page(client, page):
    """Fetch a single page of jobs"""
    url = f"{SEARCH_URL}&page={page}"
    data = await fetch_with_retry(client, url)
    jobs = (data.get("_embedded") or {}).get("jobs") or []
    return jobs, data.get("pages", 0)


async def fetch_all_jobs(client):
    """Fetch all pages of jobs, deduplicated by ID"""
    jobs_by_id = {}
    
    # Get first page to know total pages
    jobs, total_pages = await fetch_page(client, 1)
    for job in jobs:
        jobs_by_id[job["id"]] = job
    print(f"  Page 1/{total_pages}: {len(jobs)} jobs, {len(jobs_by_id)} unique")
    
    # Fetch remaining pages
    for page in range(2, total_pages + 1):
        jobs, _ = await fetch_page(client, page)
        for job in jobs:
            jobs_by_id[job["id"]] = job
        print(f"  Page {page}/{total_pages}: {len(jobs)} jobs, {len(jobs_by_id)} unique total")
    
    return list(jobs_by_id.values())


# ============ MAIN ============

async def scrape():
    print("=" * 50)
    print("NVB SCRAPER")
    print("=" * 50)
    
    print(f"  Using proxy: {PROXY[:30]}..." if PROXY else "  No proxy configured!")
    client = rnet.Client(proxy=PROXY) if PROXY else rnet.Client()
    conn = setup_db()
    
    # Step 1: Fetch all jobs from API (includes full details)
    print("\n[1] Fetching all jobs from API...")
    all_jobs = await fetch_all_jobs(client)
    api_ids = set(job["id"] for job in all_jobs)
    print(f"  Total from API: {len(api_ids)} internships")
    
    # Step 2: Compare with database
    print("\n[2] Comparing with database...")
    db_ids = get_existing_ids(conn, SOURCE)
    print(f"  Existing in DB: {len(db_ids)}")
    
    to_delete = db_ids - api_ids
    to_add = api_ids - db_ids
    
    print(f"  To delete: {len(to_delete)}")
    print(f"  To add: {len(to_add)}")
    print(f"  Unchanged: {len(db_ids & api_ids)}")
    
    # Step 3: Delete removed listings
    if to_delete:
        print("\n[3] Deleting removed listings...")
        delete_ids(conn, SOURCE, to_delete)
        print(f"  Deleted {len(to_delete)}")
    else:
        print("\n[3] No listings to delete")
    
    # Step 4: Add new listings (details already fetched)
    if to_add:
        jobs_to_add = [j for j in all_jobs if j["id"] in to_add]
        print(f"\n[4] Adding {len(jobs_to_add)} new listings...")
        done = 0
        for job in jobs_to_add:
            normalized = normalize(job)
            save_internship(conn, normalized)
            done += 1
            if done % 100 == 0:
                print(f"  Progress: {done}/{len(jobs_to_add)}")
                conn.commit()
        conn.commit()
        print(f"  Added {done} new listings")
    else:
        print("\n[4] No new listings to add")
    
    conn.close()
    print("\n" + "=" * 50)
    print("NVB DONE!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(scrape())
