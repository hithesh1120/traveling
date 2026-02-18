import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from database import engine, Base
from seed_data import seed_data

from sqlalchemy import text

async def reset_database():
    print("Dropping all tables with CASCADE...")
    async with engine.begin() as conn:
        # Drop all tables defined in Base.metadata
        for table in Base.metadata.sorted_tables:
             print(f"Dropping {table.name}...")
             await conn.execute(text(f"DROP TABLE IF EXISTS {table.name} CASCADE"))
        # Also try to drop tables that might not be in sorted_tables if renamed? 
        # But for now, let's rely on metadata.
        # Actually, audit_logs might be an issue.
        await conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS deliveries CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS vendors CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS docks CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS vehicles CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS zones CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS shipments CASCADE"))
        # Using specific list to be sure
    print("Tables dropped.")
    
    print("Re-seeding database...")
    await seed_data()
    print("Database reset complete.")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reset_database())
