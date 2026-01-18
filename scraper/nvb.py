"""
NVB scraper (template)
Scrapes internships from NVB and normalizes to unified schema

TODO: Implement API calls based on NVB's API structure
"""
import os
import asyncio
import rnet
from db import setup_db, get_existing_ids, delete_ids, save_internship

SOURCE = "nvb"
PROXY = os.environ.get("PROXY")
CONCURRENCY = 50

# API endpoints - TODO: fill in actual URLs
SEARCH_URL = "https://..."
DETAIL_URL = "https://..."


def extract_keywords(raw):
    """
    Extract keywords from NVB data
    Sources: dcoTitles[].title + industries + jobTitles
    """
    keywords = set()
    
    # From dcoTitles
    for dco in raw.get("dcoTitles", []):
        if dco.get("title"):
            keywords.add(dco["title"].lower())
    
    # From industries
    for ind in raw.get("industries", []):
        keywords.add(ind.lower())
    
    # From jobTitles
    for jt in raw.get("jobTitles", []):
        keywords.add(jt.lower())
    
    return [k for k in keywords if k and len(k) > 2]


def normalize(raw):
    """Transform NVB API response to unified schema"""
    # TODO: Map fields from NVB's API response
    
    return {
        "id": raw.get("id"),
        "source": SOURCE,
        "title": raw.get("title"),
        "description": raw.get("description"),
        "media": raw.get("media", []),
        
        "company": {
            "name": raw.get("companyName"),
            "site": raw.get("companyWebsite"),
            "logo": raw.get("companyLogo"),
        },
        
        "apply": {
            "option": "link",  # or "email"
            "value": raw.get("applyUrl") or raw.get("applyEmail"),
        },
        
        "location": {
            "street": raw.get("street"),
            "zip": raw.get("zip"),
            "city": raw.get("city"),
            "province": raw.get("province"),
            "country": "NL",
            "coords": {"lat": raw.get("lat"), "lon": raw.get("lon")},
        },
        
        "level": "hbo",  # TODO: map from raw data
        "sublevel": None,
        "keywords": extract_keywords(raw),
        
        "start_date": raw.get("startDate"),
        "end_date": raw.get("endDate"),
        
        "raw": raw,
    }


# ============ API FETCHERS ============

async def fetch_with_retry(client, url):
    while True:
        try:
            resp = await client.get(url)
            return await resp.json()
        except Exception as e:
            print(f"  Retry: {e}")
            await asyncio.sleep(0.5)


async def fetch_all_ids(client):
    """Fetch all internship IDs from NVB search API"""
    # TODO: implement pagination/search logic
    data = await fetch_with_retry(client, SEARCH_URL)
    return [item["id"] for item in data.get("items", [])]


async def fetch_detail(client, sem, internship_id):
    async with sem:
        data = await fetch_with_retry(client, f"{DETAIL_URL}/{internship_id}")
        return internship_id, data


# ============ MAIN ============

async def scrape():
    print("=" * 50)
    print("NVB SCRAPER")
    print("=" * 50)
    
    client = rnet.Client(proxy=PROXY) if PROXY else rnet.Client()
    conn = setup_db()
    sem = asyncio.Semaphore(CONCURRENCY)
    
    # Step 1: Get all IDs from API
    print("\n[1] Fetching all internship IDs...")
    api_ids = set(await fetch_all_ids(client))
    print(f"  Total from API: {len(api_ids)}")
    
    # Step 2: Compare with database
    print("\n[2] Comparing with database...")
    db_ids = get_existing_ids(conn, SOURCE)
    print(f"  Existing in DB: {len(db_ids)}")
    
    to_delete = db_ids - api_ids
    to_add = api_ids - db_ids
    
    print(f"  To delete: {len(to_delete)}")
    print(f"  To add: {len(to_add)}")
    
    # Step 3: Delete removed listings
    if to_delete:
        print("\n[3] Deleting removed listings...")
        delete_ids(conn, SOURCE, to_delete)
        print(f"  Deleted {len(to_delete)}")
    
    # Step 4: Fetch and add new listings
    if to_add:
        print(f"\n[4] Fetching {len(to_add)} new listings...")
        tasks = [fetch_detail(client, sem, id) for id in to_add]
        done = 0
        for coro in asyncio.as_completed(tasks):
            internship_id, raw = await coro
            normalized = normalize(raw)
            save_internship(conn, normalized)
            done += 1
            if done % 100 == 0:
                print(f"  Progress: {done}/{len(to_add)}")
                conn.commit()
        conn.commit()
        print(f"  Added {done} new listings")
    
    conn.close()
    print("\n" + "=" * 50)
    print("NVB DONE!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(scrape())
