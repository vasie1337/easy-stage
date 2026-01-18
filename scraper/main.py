"""
Main scraper runner
Runs all platform scrapers sequentially
"""
import asyncio
import stagemarkt
# import nvb  # Uncomment when ready


async def main():
    print("=" * 60)
    print("INTERNSHIP SCRAPER - Running all platforms")
    print("=" * 60)
    
    # Run each scraper
    await stagemarkt.scrape()
    
    # Uncomment when NVB is ready:
    # await nvb.scrape()
    
    print("\n" + "=" * 60)
    print("ALL SCRAPERS COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
