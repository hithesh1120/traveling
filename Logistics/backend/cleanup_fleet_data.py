
import asyncio
import sys
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add current directory to path so we can import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DATABASE_URL

async def cleanup_fleet_data():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Cleaning up FLEET_MANAGER users...")
        # Delete users with role 'FLEET_MANAGER'
        # Since we removed the enum value from Python creating a textual query is safer
        # We need to cast to text because the column is an enum type
        
        # Check if any exist first
        result = await conn.execute(text("SELECT count(*) FROM users WHERE role::text = 'FLEET_MANAGER'"))
        count = result.scalar()
        print(f"Found {count} users with role FLEET_MANAGER")
        
        if count > 0:
            await conn.execute(text("DELETE FROM users WHERE role::text = 'FLEET_MANAGER'"))
            print(f"Deleted {count} users.")
            
    await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(cleanup_fleet_data())
