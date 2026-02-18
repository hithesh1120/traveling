```python

import asyncio
from sqlalchemy import select, func
import database
import models

async def debug_analytics():
    async with database.AsyncSessionLocal() as db:
        print("1. Testing Total Count Query")
        try:
            res_total = await db.execute(select(func.count(models.Vehicle.id)))
            total = res_total.scalar() or 0
            print(f"Total Vehicles: {total}")
        except Exception as e:
            print(f"Error in Total Count: {e}")

        print("\n2. Testing Status Filter Query")
        try:
            res_avail = await db.execute(select(func.count(models.Vehicle.id)).where(models.Vehicle.status == models.VehicleStatus.AVAILABLE))
            available = res_avail.scalar() or 0
            print(f"Available: {available}")
        except Exception as e:
            print(f"Error in Status Filter: {e}")

if __name__ == "__main__":
    asyncio.run(debug_analytics())
