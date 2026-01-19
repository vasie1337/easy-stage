"""
Meilisearch sync
Syncs internships from Postgres to Meilisearch
"""
import os
import json
import meilisearch
from db import get_connection

MEILI_URL = os.environ.get("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.environ.get("MEILI_MASTER_KEY", "masterkey123456")
INDEX_NAME = "internships"


def get_meili_client():
    return meilisearch.Client(MEILI_URL, MEILI_MASTER_KEY)


def setup_index(client):
    """Configure Meilisearch index settings"""
    index = client.index(INDEX_NAME)
    
    # Update settings based on schema
    index.update_settings({
        "searchableAttributes": [
            "title",
            "description",
            "keywords",
            "company_name",
            "location_city"
        ],
        "filterableAttributes": [
            "level",
            "sublevel",
            "location_province",
            "location_city",
            "source"
        ],
        "sortableAttributes": [
            "start_date",
            "updated_at"
        ],
        "rankingRules": [
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness"
        ],
        "pagination": {
            "maxTotalHits": 100000
        }
    })
    
    return index


def fetch_all_internships(conn):
    """Fetch all internships from Postgres"""
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            id, source, title, description, media,
            company_name, company_site, company_logo,
            apply_option, apply_value,
            location_street, location_zip, location_city, location_province, location_country, location_lat, location_lon,
            level, sublevel, keywords,
            start_date, end_date,
            updated_at
        FROM internships
    """)
    
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    
    documents = []
    for row in rows:
        doc = dict(zip(columns, row))
        # Parse JSON fields
        if doc.get("media"):
            doc["media"] = json.loads(doc["media"]) if isinstance(doc["media"], str) else doc["media"]
        if doc.get("keywords"):
            doc["keywords"] = json.loads(doc["keywords"]) if isinstance(doc["keywords"], str) else doc["keywords"]
        # Convert timestamps to strings
        if doc.get("updated_at"):
            doc["updated_at"] = doc["updated_at"].isoformat()
        documents.append(doc)
    
    return documents


def sync():
    print("=" * 50)
    print("MEILISEARCH SYNC")
    print("=" * 50)
    
    client = get_meili_client()
    conn = get_connection()
    
    # Setup index
    print("\n[1] Configuring index...")
    index = setup_index(client)
    print(f"  Index '{INDEX_NAME}' configured")
    
    # Fetch all documents
    print("\n[2] Fetching from Postgres...")
    documents = fetch_all_internships(conn)
    print(f"  Found {len(documents)} internships")
    
    if not documents:
        print("\n[3] No documents to sync")
        conn.close()
        return
    
    # Sync to Meilisearch (replace all)
    print(f"\n[3] Syncing to Meilisearch...")
    
    # Delete all existing documents first
    index.delete_all_documents()
    
    # Add documents in batches of 1000
    batch_size = 1000
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        task = index.add_documents(batch)
        print(f"  Batch {i // batch_size + 1}: {len(batch)} documents (task: {task.task_uid})")
    
    # Wait for indexing to complete (10 min timeout for large datasets)
    print("\n[4] Waiting for indexing...")
    client.wait_for_task(task.task_uid, timeout_in_ms=600000, interval_in_ms=1000)
    
    # Get stats
    stats = index.get_stats()
    print(f"  Indexed: {stats.number_of_documents} documents")
    
    conn.close()
    print("\n" + "=" * 50)
    print("MEILISEARCH SYNC DONE!")
    print("=" * 50)


if __name__ == "__main__":
    sync()
