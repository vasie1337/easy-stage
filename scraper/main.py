"""
Main scraper runner
Runs all platform scrapers, then syncs to Meilisearch
"""
import asyncio
import stagemarkt
import nvb
import meili_sync


async def main():
    print("=" * 60)
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
