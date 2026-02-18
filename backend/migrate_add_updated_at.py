"""Add updated_at column to shipments table if missing."""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from database import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)

async def migrate():
    async with engine.begin() as conn:
        # Add updated_at to shipments if not exists
        try:
            await conn.execute(text(
                "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"
            ))
            print("Added updated_at column to shipments")
        except Exception as e:
            print(f"Column may already exist: {e}")
    
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate())
