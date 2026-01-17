import rnet
import sqlite3
import json
import asyncio

# API endpoints
SUGGESTIES_URL = "https://stagemarkt.nl/api/query-hub/opleiding-suggesties?siteId=STAGEMARKT&term=&pageSize=9999&niveau="
SEARCH_URL = "https://stagemarkt.nl/api/query-hub/education-search?siteId=STAGEMARKT&pageSize=1000&range=1000&plaatsPostcode=utrecht&buitenlandseBedrijven=false"
DETAIL_URL = "https://stagemarkt.nl/api/query-hub/education-detail?siteId=STAGEMARKT&id="

def setup_db():
    conn = sqlite3.connect("stagemarkt.db")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS crebocodes (
            crebocode TEXT PRIMARY KEY,
            niveau INTEGER,
            label TEXT
        )
    """)
    conn.execute("""
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
            kerntaken TEXT,
            kenmerken TEXT,
            media TEXT,
            vergoedingen TEXT,
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
            raw_json TEXT
        )
    """)
    conn.commit()
    return conn

async def fetch_crebocodes(client, niveau):
    resp = await client.get(SUGGESTIES_URL + str(niveau))
    data = await resp.json()
    items = data.get("body", {}).get("data", {}).get("items", [])
    return [(item["creboCode"], niveau, item["label"]) for item in items]

async def fetch_ids_for_crebo(client, crebocode, niveau):
    url = f"{SEARCH_URL}&crebocode={crebocode}&niveau={niveau}"
    resp = await client.get(url)
    data = await resp.json()
    return [item["leerplaatsId"] for item in data.get("items", [])]

async def fetch_detail(client, internship_id):
    resp = await client.get(DETAIL_URL + internship_id)
    return await resp.json()

def save_crebocode(conn, crebocode, niveau, label):
    conn.execute("INSERT OR REPLACE INTO crebocodes VALUES (?,?,?)", (str(crebocode), niveau, label))
    conn.commit()

def save_to_db(conn, data):
    adres = data.get("adres") or {}
    coords = adres.get("coordinaten") or {}
    org = data.get("organisatie") or {}
    kwal = data.get("kwalificatie") or {}
    
    conn.execute("""
        INSERT OR REPLACE INTO internships VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
    conn.commit()

async def main():
    client = rnet.Client()
    conn = setup_db()
    
    # Step 1: Fetch all crebocodes for each niveau
    print("Fetching crebocodes for each niveau...")
    all_crebos = []
    for niveau in range(5):  # 0,1,2,3,4
        print(f"  Niveau {niveau}...", end=" ")
        crebos = await fetch_crebocodes(client, niveau)
        print(f"{len(crebos)} crebocodes")
        for crebocode, niv, label in crebos:
            save_crebocode(conn, crebocode, niv, label)
            all_crebos.append((crebocode, niv))
    
    print(f"\nTotal: {len(all_crebos)} crebocodes")
    
    # Step 2: For each crebocode, fetch all internship IDs
    print("\nFetching internship IDs for each crebocode...")
    all_ids = set()
    for i, (crebocode, niveau) in enumerate(all_crebos, 1):
        print(f"  [{i}/{len(all_crebos)}] Crebo {crebocode} (niveau {niveau})...", end=" ")
        try:
            ids = await fetch_ids_for_crebo(client, crebocode, niveau)
            print(f"{len(ids)} internships")
            all_ids.update(ids)
        except Exception as e:
            print(f"Error: {e}")
    
    print(f"\nTotal unique internships: {len(all_ids)}")
    
    # Step 3: Fetch details for each internship
    print("\nFetching internship details...")
    all_ids = list(all_ids)
    for i, internship_id in enumerate(all_ids, 1):
        print(f"[{i}/{len(all_ids)}] {internship_id}")
        try:
            detail = await fetch_detail(client, internship_id)
            save_to_db(conn, detail)
        except Exception as e:
            print(f"  Error: {e}")
    
    conn.close()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
