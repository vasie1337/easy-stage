"""
Main scraper runner
Runs all platform scrapers, then syncs to Meilisearch
"""
import os
import sys
import asyncio
import psycopg2
import meilisearch
import stagemarkt
import nvb
import meili_sync

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://stagemarkt:stagemarkt@localhost:5432/stagemarkt")
MEILI_URL = os.environ.get("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.environ.get("MEILI_MASTER_KEY")


def test_connections():
    """Test database and Meilisearch connections before starting"""
    print("=" * 60)
    print("TESTING CONNECTIONS")
    print("=" * 60)
    
    # Test PostgreSQL
    print("\n[1] Testing PostgreSQL connection...")
    print(f"    URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        conn.close()
        print("    ✓ PostgreSQL connection successful")
    except Exception as e:
        print(f"    ✗ PostgreSQL connection failed: {e}")
        return False
    
    # Test Meilisearch
    print("\n[2] Testing Meilisearch connection...")
    print(f"    URL: {MEILI_URL}")
    if not MEILI_MASTER_KEY:
        print("    ✗ MEILI_MASTER_KEY not set")
        return False
    try:
        client = meilisearch.Client(MEILI_URL, MEILI_MASTER_KEY)
        health = client.health()
        print(f"    ✓ Meilisearch connection successful (status: {health['status']})")
    except Exception as e:
        print(f"    ✗ Meilisearch connection failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("ALL CONNECTIONS OK")
    print("=" * 60)
    return True


async def main():
    # Test connections first
    if not test_connections():
        print("\n✗ Connection test failed. Exiting.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("INTERNSHIP SCRAPER - Running all platforms")
    print("=" * 60)
    
    # Run each scraper
    await nvb.scrape()
    await stagemarkt.scrape()
    
    # Sync to Meilisearch
    meili_sync.sync()
    
    print("\n" + "=" * 60)
    print("ALL COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
