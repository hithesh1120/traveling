import asyncio
from sqlalchemy import select, func
from database import AsyncSessionLocal as async_session, engine
import models
import datetime
import sys

# Windows policy fix
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_all_queries():
    print("--- TESTING QUERIES DIRECTLY ---")
    async with async_session() as db:
        print("1. Fleet Query")
        try:
            res = await db.execute(
                select(models.Vehicle.status, func.count(models.Vehicle.id))
                .group_by(models.Vehicle.status)
            )
            stats = dict(res.all())
            print(f"   Success. Stats: {stats}")
        except Exception as e:
            print(f"   FAILED: {e}")

        print("\n2. Shipments Query (Totals)")
        try:
            res_status = await db.execute(
                select(models.Shipment.status, func.count(models.Shipment.id))
                .group_by(models.Shipment.status)
            )
            status_counts = dict(res_status.all())
            print(f"   Success. Counts: {status_counts}")
        except Exception as e:
            print(f"   FAILED: {e}")

        print("\n3. Shipments Query (Today)")
        try:
            today = datetime.datetime.utcnow().date()
            start_of_day = datetime.datetime.combine(today, datetime.time.min)
            res_today = await db.execute(
                select(func.count(models.Shipment.id))
                .where(models.Shipment.created_at >= start_of_day)
            )
            today_count = res_today.scalar() or 0
            print(f"   Success. Today: {today_count}")
        except Exception as e:
            print(f"   FAILED: {e}")
            
        print("\n4. Driver Analytics")
        try:
            res_drivers = await db.execute(select(models.User).where(models.User.role == models.UserRole.DRIVER))
            drivers = res_drivers.scalars().all()
            print(f"   Found {len(drivers)} drivers.")
            
            for d in drivers:
                # Total
                res_total = await db.execute(select(func.count(models.Shipment.id)).where(models.Shipment.assigned_driver_id == d.id))
                print(f"   Driver {d.id} total: {res_total.scalar()}")
        except Exception as e:
            print(f"   FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_queries())
