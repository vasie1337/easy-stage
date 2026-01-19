"""
Stagemarkt.nl scraper
Scrapes internships from stagemarkt.nl and normalizes to unified schema
"""
import os
import json
import asyncio
import rnet
from rnet import Proxy
from db import setup_db, get_existing_ids, delete_ids, save_internship

SOURCE = "stagemarkt"
CONCURRENCY = 50

# API endpoints
SUGGESTIES_URL = "https://stagemarkt.nl/api/query-hub/opleiding-suggesties?siteId=STAGEMARKT&term=&pageSize=9999&niveau="
SEARCH_URL = "https://stagemarkt.nl/api/query-hub/education-search?siteId=STAGEMARKT&pageSize=9999&range=9999&plaatsPostcode=Utrecht&buitenlandseBedrijven=false"
DETAIL_URL = "https://stagemarkt.nl/api/query-hub/education-detail?siteId=STAGEMARKT&id="

# MBO niveau mapping
LEVEL_MAP = {
    "Niveau 1": "mbo1",
    "Niveau 2": "mbo2", 
    "Niveau 3": "mbo3",
    "Niveau 4": "mbo4",
}

STOPWORDS = {
    'de', 'het', 'een', 'en', 'van', 'in', 'op', 'te', 'voor', 'met', 'aan',
    'naar', 'om', 'bij', 'als', 'tot', 'uit', 'dat', 'die', 'zijn', 'worden',
    'kan', 'moet', 'zal', 'zou', 'heeft', 'hebben', 'wordt', 'werd', 'zijn',
    'was', 'waren', 'ben', 'bent', 'is', 'deze', 'dit', 'ook', 'meer', 'veel',
    'niet', 'nog', 'wel', 'dan', 'maar', 'over', 'door', 'onder', 'tussen',
    'binnen', 'buiten', 'achter', 'boven', 'beneden', 'zonder', 'tegen',
    'tijdens', 'volgens', 'naast', 'langs', 'vanaf', 'rondom', 'mbt',
}

def extract_single_keywords(text):
    """Extract single-word keywords from text, filtering stopwords"""
    if not text:
        return []
    
    # Clean and split
    text = text.lower()
    # Replace common separators with space
    for sep in [',', '/', '-', '(', ')', '.', ':', ';', '&', '+']:
        text = text.replace(sep, ' ')
    
    words = text.split()
    
    # Filter: 3-25 chars, not stopword, not all digits
    return [
        w for w in words
        if 3 <= len(w) <= 25
        and w not in STOPWORDS
        and not w.isdigit()
    ]

def extract_keywords(raw):
    """Extract keywords from stagemarkt data"""
    keywords = set()
    
    # From kerntaken - extract individual words
    for kt in raw.get("kerntaken", []):
        if kt.get("naam"):
            keywords.update(extract_single_keywords(kt["naam"]))
        for st in kt.get("subtaken", []):
            if st.get("naam"):
                keywords.update(extract_single_keywords(st["naam"]))
    
    # From kwalificatie naam
    kwal = raw.get("kwalificatie", {})
    if kwal.get("naam"):
        keywords.update(extract_single_keywords(kwal["naam"]))
    
    # From vaardigheden
    if raw.get("vaardigheden"):
        keywords.update(extract_single_keywords(raw["vaardigheden"]))
    
    return list(keywords)[:15]  # Max 15 keywords


def normalize(raw):
    """Transform stagemarkt API response to unified schema"""
    adres = raw.get("adres") or {}
    coords = adres.get("coordinaten") or {}
    org = raw.get("organisatie") or {}
    kwal = raw.get("kwalificatie") or {}
    
    return {
        "id": raw.get("id"),
        "source": SOURCE,
        "title": raw.get("wervendeTitel") or raw.get("titel"),
        "description": raw.get("omschrijving"),
        "media": raw.get("media", []),
        
        "company": {
            "name": org.get("naam"),
            "site": org.get("website"),
            "logo": org.get("logoUrl"),
        },
        
        "apply": {
            "option": "email",
            "value": raw.get("emailadres") or org.get("emailadres"),
        },
        
        "location": {
            "street": f"{adres.get('straat', '')} {adres.get('huisnummer', '')}".strip(),
            "zip": adres.get("postcode"),
            "city": adres.get("plaats"),
            "province": None,  # Not provided by stagemarkt
            "country": "NL",
            "coords": {"lat": coords.get("lat"), "lon": coords.get("lon")} if coords else None,
        },
        
        "level": LEVEL_MAP.get(kwal.get("niveaunaam")),
        "sublevel": kwal.get("crebocode"),
        "keywords": extract_keywords(raw),
        
        "start_date": raw.get("startdatum"),
        "end_date": raw.get("einddatum"),
        
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
            print(f"  Retry {attempt + 1}/{max_retries} (waiting {delay}s): {e}")
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)  # Exponential backoff, max 30s


async def fetch_crebocodes(client, niveau):
    data = await fetch_with_retry(client, SUGGESTIES_URL + str(niveau))
    items = ((data.get("body") or {}).get("data") or {}).get("items") or []
    print(f"  Niveau {niveau}: {len(items)} crebocodes")
    return [(item["creboCode"], niveau) for item in items]


async def fetch_ids_for_crebo(client, sem, crebocode, niveau):
    async with sem:
        url = f"{SEARCH_URL}&crebocode={crebocode}&niveau={niveau}"
        data = await fetch_with_retry(client, url)
        return [item["leerplaatsId"] for item in data.get("items", [])]


async def fetch_detail(client, sem, internship_id):
    async with sem:
        data = await fetch_with_retry(client, DETAIL_URL + internship_id)
        return internship_id, data


# ============ MAIN ============

async def scrape():
    print("=" * 50)
    print("STAGEMARKT SCRAPER")
    print("=" * 50)
    
    client = rnet.Client(proxies=[Proxy.https("http://user-zxczxc_I3mEC:IaZG+3av+AZI0lng@dc.oxylabs.io:8000")])
    conn = setup_db()
    sem = asyncio.Semaphore(CONCURRENCY)
    
    # Step 1: Get all crebocodes
    print("\n[1] Fetching crebocodes...")
    tasks = [fetch_crebocodes(client, n) for n in range(5)]
    results = await asyncio.gather(*tasks)
    all_crebos = [item for sublist in results for item in sublist]
    print(f"  Total: {len(all_crebos)} crebocodes")
    
    # Step 2: Get all internship IDs from API
    print("\n[2] Fetching all internship IDs from API...")
    tasks = [fetch_ids_for_crebo(client, sem, c, n) for c, n in all_crebos]
    api_ids = set()
    done = 0
    for coro in asyncio.as_completed(tasks):
        ids = await coro
        api_ids.update(ids)
        done += 1
        if done % 100 == 0:
            print(f"  Progress: {done}/{len(all_crebos)} crebocodes, {len(api_ids)} unique IDs")
    print(f"  Total from API: {len(api_ids)} unique internships")
    
    # Step 3: Compare with database
    print("\n[3] Comparing with database...")
    db_ids = get_existing_ids(conn, SOURCE)
    print(f"  Existing in DB: {len(db_ids)}")
    
    to_delete = db_ids - api_ids
    to_add = api_ids - db_ids
    
    print(f"  To delete: {len(to_delete)}")
    print(f"  To add: {len(to_add)}")
    print(f"  Unchanged: {len(db_ids & api_ids)}")
    
    # Step 4: Delete removed listings
    if to_delete:
        print("\n[4] Deleting removed listings...")
        delete_ids(conn, SOURCE, to_delete)
        print(f"  Deleted {len(to_delete)} listings")
    else:
        print("\n[4] No listings to delete")
    
    # Step 5: Fetch and add new listings
    if to_add:
        print(f"\n[5] Fetching {len(to_add)} new listings...")
        tasks = [fetch_detail(client, sem, id) for id in to_add]
        
        # Collect all results first (parallel HTTP fetches)
        results = []
        done = 0
        for coro in asyncio.as_completed(tasks):
            internship_id, raw = await coro
            results.append((internship_id, raw))
            done += 1
            if done % 100 == 0:
                print(f"  Fetched: {done}/{len(to_add)}")
        
        # Now save sequentially (avoids deadlocks)
        print(f"  Saving {len(results)} to database...")
        for i, (internship_id, raw) in enumerate(results):
            normalized = normalize(raw)
            save_internship(conn, normalized)
            if (i + 1) % 1000 == 0:
                conn.commit()
                print(f"  Saved: {i+1}/{len(results)}")
        conn.commit()
        print(f"  Added {len(results)} new listings")
    else:
        print("\n[5] No new listings to add")
    
    conn.close()
    print("\n" + "=" * 50)
    print("STAGEMARKT DONE!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(scrape())
