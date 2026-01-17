import os
import json
import asyncio
import rnet
import psycopg2

# Config
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://stagemarkt:stagemarkt@localhost:5432/stagemarkt")
PROXY = os.environ.get("PROXY")
CONCURRENCY = 50

# API endpoints
SUGGESTIES_URL = "https://stagemarkt.nl/api/query-hub/opleiding-suggesties?siteId=STAGEMARKT&term=&pageSize=9999&niveau="
SEARCH_URL = "https://stagemarkt.nl/api/query-hub/education-search?siteId=STAGEMARKT&pageSize=9999&range=9999&plaatsPostcode=Utrecht&buitenlandseBedrijven=false"
DETAIL_URL = "https://stagemarkt.nl/api/query-hub/education-detail?siteId=STAGEMARKT&id="


def setup_db():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS internships (
            id TEXT PRIMARY KEY,
            aantal INTEGER,
            contactpersoon TEXT,
            emailadres TEXT,
            telefoon TEXT,
            omschrijving TEXT,
            titel TEXT,
            wervende_titel TEXT,
            vaardigheden TEXT,
            aanbieden TEXT,
            website TEXT,
            adres_huisnummer TEXT,
            adres_plaats TEXT,
            adres_postcode TEXT,
            adres_straat TEXT,
            adres_lat REAL,
            adres_lon REAL,
            organisatie_id TEXT,
            organisatie_naam TEXT,
            organisatie_telefoon TEXT,
            organisatie_email TEXT,
            organisatie_website TEXT,
            organisatie_logo TEXT,
            organisatie_grootte TEXT,
            organisatie_leerbedrijf_id TEXT,
            organisatie_omschrijving TEXT,
            kerntaken JSONB,
            kenmerken JSONB,
            media JSONB,
            vergoedingen JSONB,
            bedrag_van REAL,
            bedrag_tot REAL,
            kwalificatie_niveau TEXT,
            kwalificatie_crebocode TEXT,
            startdatum TEXT,
            einddatum TEXT,
            leerweg TEXT,
            study_description TEXT,
            gewijzigd_datum TEXT,
            dagen_per_week TEXT,
            raw_json JSONB
        )
    """)
    conn.commit()
    return conn


def get_existing_ids(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM internships")
    return set(row[0] for row in cur.fetchall())


def delete_ids(conn, ids):
    if not ids:
        return
    cur = conn.cursor()
    cur.execute("DELETE FROM internships WHERE id = ANY(%s)", (list(ids),))
    conn.commit()


def save_internship(conn, data):
    adres = data.get("adres") or {}
    coords = adres.get("coordinaten") or {}
    org = data.get("organisatie") or {}
    kwal = data.get("kwalificatie") or {}
    
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO internships VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (id) DO UPDATE SET
            aantal=EXCLUDED.aantal, contactpersoon=EXCLUDED.contactpersoon, emailadres=EXCLUDED.emailadres,
            telefoon=EXCLUDED.telefoon, omschrijving=EXCLUDED.omschrijving, titel=EXCLUDED.titel,
            wervende_titel=EXCLUDED.wervende_titel, vaardigheden=EXCLUDED.vaardigheden, aanbieden=EXCLUDED.aanbieden,
            website=EXCLUDED.website, raw_json=EXCLUDED.raw_json, gewijzigd_datum=EXCLUDED.gewijzigd_datum
    """, (
        data.get("id"),
        data.get("aantal"),
        data.get("contactpersoon"),
        data.get("emailadres"),
        data.get("telefoon"),
        data.get("omschrijving"),
        data.get("titel"),
        data.get("wervendeTitel"),
        data.get("vaardigheden"),
        data.get("aanbieden"),
        data.get("website"),
        adres.get("huisnummer"),
        adres.get("plaats"),
        adres.get("postcode"),
        adres.get("straat"),
        coords.get("lat"),
        coords.get("lon"),
        org.get("id"),
        org.get("naam"),
        org.get("telefoonnummer"),
        org.get("emailadres"),
        org.get("website"),
        org.get("logoUrl"),
        org.get("bedrijfsgrootte"),
        org.get("leerbedrijfId"),
        org.get("omschrijving"),
        json.dumps(data.get("kerntaken", [])),
        json.dumps(data.get("kenmerken", [])),
        json.dumps(data.get("media", [])),
        json.dumps(data.get("vergoedingen", [])),
        data.get("bedragVan"),
        data.get("bedragTot"),
        kwal.get("niveaunaam"),
        kwal.get("crebocode"),
        data.get("startdatum"),
        data.get("einddatum"),
        data.get("leerweg"),
        data.get("studyDescription"),
        data.get("gewijzigdDatum"),
        data.get("dagenPerWeek"),
        json.dumps(data)
    ))


# ============ API FETCHERS (with retry) ============

async def fetch_with_retry(client, url):
    while True:
        try:
            resp = await client.get(url)
            return await resp.json()
        except Exception as e:
            print(f"  Retry: {e}")
            await asyncio.sleep(0.5)


async def fetch_crebocodes(client, niveau):
    data = await fetch_with_retry(client, SUGGESTIES_URL + str(niveau))
    items = data.get("body", {}).get("data", {}).get("items", [])
    print(f"  Niveau {niveau}: {len(items)} crebocodes")
    return [(item["creboCode"], niveau) for item in items]


async def fetch_ids_for_crebo(client, sem, crebocode, niveau):
    async with sem:
        url = f"{SEARCH_URL}&crebocode={crebocode}&niveau={niveau}"
        data = await fetch_with_retry(client, url)
        items = data.get("items", [])
        if not items and data.get("totalCount", 0) > 0:
            print(f"  DEBUG: crebo {crebocode} has totalCount={data.get('totalCount')} but no items!")
        return [item["leerplaatsId"] for item in items]


async def fetch_detail(client, sem, internship_id):
    async with sem:
        data = await fetch_with_retry(client, DETAIL_URL + internship_id)
        return internship_id, data


# ============ MAIN ============

async def main():
    print("=" * 50)
    print("STAGEMARKT SCRAPER")
    print("=" * 50)
    
    # Setup
    client = rnet.Client(proxy=PROXY) if PROXY else rnet.Client()
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
    print(f"  Using proxy: {PROXY}")
    
    # Debug: test one request first
    test_url = f"{SEARCH_URL}&crebocode={all_crebos[0][0]}&niveau={all_crebos[0][1]}"
    print(f"  Testing: {test_url}")
    test_data = await fetch_with_retry(client, test_url)
    print(f"  Test response keys: {list(test_data.keys())}")
    print(f"  Test totalCount: {test_data.get('totalCount', 'N/A')}, items: {len(test_data.get('items', []))}")
    
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
    db_ids = get_existing_ids(conn)
    print(f"  Existing in DB: {len(db_ids)}")
    
    to_delete = db_ids - api_ids  # In DB but not in API = deleted
    to_add = api_ids - db_ids      # In API but not in DB = new
    unchanged = db_ids & api_ids   # In both = skip
    
    print(f"  To delete: {len(to_delete)}")
    print(f"  To add: {len(to_add)}")
    print(f"  Unchanged: {len(unchanged)}")
    
    # Step 4: Delete removed listings
    if to_delete:
        print("\n[4] Deleting removed listings...")
        delete_ids(conn, to_delete)
        print(f"  Deleted {len(to_delete)} listings")
    else:
        print("\n[4] No listings to delete")
    
    # Step 5: Fetch and add new listings
    if to_add:
        print(f"\n[5] Fetching {len(to_add)} new listings...")
        tasks = [fetch_detail(client, sem, id) for id in to_add]
        done = 0
        for coro in asyncio.as_completed(tasks):
            internship_id, detail = await coro
            save_internship(conn, detail)
            done += 1
            if done % 100 == 0:
                print(f"  Progress: {done}/{len(to_add)}")
                conn.commit()
        conn.commit()
        print(f"  Added {done} new listings")
    else:
        print("\n[5] No new listings to add")
    
    conn.close()
    print("\n" + "=" * 50)
    print("DONE!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
