
import asyncio
import sys
import os
import uuid
import random
from datetime import datetime, timedelta

sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import select
from database import DATABASE_URL, AsyncSessionLocal
from models import (User, UserRole, Company, Shipment, ShipmentStatus, ShipmentItem, SavedAddress)

engine = create_async_engine(DATABASE_URL)

REAL_LOCATIONS = [
    {"label": "Peenya Manufacturing Hub", "address": "Peenya Industrial Area, Bangalore, KA", "lat": 13.0285, "lng": 77.5195},
    {"label": "Whitefield Export Zone", "address": "Whitefield Industrial Suburb, Bangalore, KA", "lat": 12.9698, "lng": 77.7500},
    {"label": "Electronic City Tech Park", "address": "Electronic City Phase 1, Bangalore, KA", "lat": 12.8452, "lng": 77.6632},
    {"label": "Bommasandra Steel Yard", "address": "Bommasandra Industrial Area, Bangalore, KA", "lat": 12.8164, "lng": 77.6914},
    {"label": "Jigani Granite Cluster", "address": "Jigani Industrial Area, Bangalore, KA", "lat": 12.7844, "lng": 77.6322},
    {"label": "Cherlapally Pharma Hub", "address": "Cherlapally Industrial Area, Hyderabad, TS", "lat": 17.4728, "lng": 78.6000},
    {"label": "Pashamylaram Metal Works", "address": "Pashamylaram Industrial Area, Hyderabad, TS", "lat": 17.5300, "lng": 78.1800},
    {"label": "Balanagar Tech Estate", "address": "Balanagar Industrial Estate, Hyderabad, TS", "lat": 17.4700, "lng": 78.4500},
    {"label": "Sanathnagar Logistics Park", "address": "Sanathnagar Industrial Area, Hyderabad, TS", "lat": 17.4500, "lng": 78.4300},
    {"label": "Jeedimetla Industrial Cluster", "address": "Jeedimetla Industrial Area, Hyderabad, TS", "lat": 17.5100, "lng": 78.4600},
]

REAL_SHIPMENTS = [
    {"name": "Precision Bearings", "weight": 5.0, "qty": 10, "dim": (0.2, 0.2, 0.2), "desc": "High-precision industrial bearings"},
    {"name": "Steel Fabrication Parts", "weight": 50.0, "qty": 10, "dim": (1.0, 0.5, 0.4), "desc": "Custom steel brackets and supports"},
    {"name": "Electrical Control Panels", "weight": 100.0, "qty": 2, "dim": (1.2, 0.8, 1.5), "desc": "Industrial switchgear panels"},
    {"name": "Industrial Lubricants", "weight": 20.0, "qty": 5, "dim": (0.4, 0.4, 0.6), "desc": "Synthetic machine oils in drums"},
    {"name": "Packaging Cardboard Rolls", "weight": 30.0, "qty": 5, "dim": (0.5, 0.5, 1.2), "desc": "Corrugated packaging raw material"},
    {"name": "Textile Raw Materials", "weight": 40.0, "qty": 10, "dim": (0.8, 0.8, 0.8), "desc": "Cotton yarn bales"},
    {"name": "Automotive Spare Parts", "weight": 10.0, "qty": 8, "dim": (0.4, 0.3, 0.3), "desc": "Engine components for assembly"},
    {"name": "Solar Panel Modules", "weight": 25.0, "qty": 12, "dim": (1.6, 1.0, 0.1), "desc": "Monocrystalline solar panels"},
    {"name": "Water Treatment Chemicals", "weight": 50.0, "qty": 5, "dim": (0.5, 0.5, 0.7), "desc": "Purification salts for ETP"},
    {"name": "Office Stationery Bulk", "weight": 2.0, "qty": 10, "dim": (0.3, 0.2, 0.3), "desc": "Assorted paper and supplies"},
]

async def seed_realistic_data():
    async with AsyncSessionLocal() as db:
        print("Fetching required entities...")
        
        # Get MSME user
        msme_res = await db.execute(select(User).where(User.role == UserRole.MSME))
        msme_user = msme_res.scalars().first()
        if not msme_user:
            print("No MSME user found. Please seed base data first.")
            return

        # Get companies
        comp_res = await db.execute(select(Company))
        companies = comp_res.scalars().all()
        if not companies:
            print("No companies found. Please seed base data first.")
            return
        
        my_company = next((c for c in companies if c.id == msme_user.company_id), companies[0])
        other_companies = [c for c in companies if c.id != my_company.id]
        if not other_companies:
            other_companies = [my_company]

        print(f"Using MSME User: {msme_user.email}")
        print(f"MSME Company: {my_company.name}")

        # 1. Add Realistic Locations
        print("Adding 10 realistic locations...")
        for loc in REAL_LOCATIONS:
            # Check if exists
            exists_res = await db.execute(select(SavedAddress).where(SavedAddress.label == loc["label"], SavedAddress.user_id == msme_user.id))
            if not exists_res.scalars().first():
                new_addr = SavedAddress(
                    user_id=msme_user.id,
                    label=loc["label"],
                    address=loc["address"],
                    lat=loc["lat"],
                    lng=loc["lng"],
                    is_global=True
                )
                db.add(new_addr)
        
        await db.flush()

        # 2. Add 10 Realistic Shipments
        print("Adding 10 realistic shipments...")
        for i, ship_info in enumerate(REAL_SHIPMENTS):
            tracking = f"SHP-{uuid.uuid4().hex[:10].upper()}"
            po = f"PO-REAL-{100 + i}"
            
            # Randomly decide if it's Collection or Delivery
            is_collection = random.choice([True, False])
            target_loc = random.choice(REAL_LOCATIONS)
            
            if is_collection:
                pickup_addr = target_loc["address"]
                pickup_lat = target_loc["lat"]
                pickup_lng = target_loc["lng"]
                pickup_contact = target_loc["label"]
                
                drop_addr = my_company.address or "123 Main St, Bangalore"
                drop_lat = my_company.lat or 12.9716
                drop_lng = my_company.lng or 77.5946
                drop_contact = my_company.name
            else:
                pickup_addr = my_company.address or "123 Main St, Bangalore"
                pickup_lat = my_company.lat or 12.9716
                pickup_lng = my_company.lng or 77.5946
                pickup_contact = my_company.name
                
                drop_addr = target_loc["address"]
                drop_lat = target_loc["lat"]
                drop_lng = target_loc["lng"]
                drop_contact = target_loc["label"]

            total_weight = ship_info["weight"] * ship_info["qty"]
            total_vol = ship_info["dim"][0] * ship_info["dim"][1] * ship_info["dim"][2] * ship_info["qty"]
            
            order_type = "Collection" if is_collection else "Delivery"
            
            shipment = Shipment(
                tracking_number=tracking,
                po_number=po,
                sender_id=msme_user.id,
                pickup_address=pickup_addr,
                pickup_lat=pickup_lat,
                pickup_lng=pickup_lng,
                pickup_contact=pickup_contact,
                drop_address=drop_addr,
                drop_lat=drop_lat,
                drop_lng=drop_lng,
                drop_contact=drop_contact,
                total_weight=total_weight,
                total_volume=total_vol,
                description=f"PO: {po} | Order Type: {order_type} | Requested By: {msme_user.name}",
                status=ShipmentStatus.PENDING,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.add(shipment)
            await db.flush()
            
            # Add item
            item = ShipmentItem(
                shipment_id=shipment.id,
                name=ship_info["name"],
                quantity=ship_info["qty"],
                weight=ship_info["weight"],
                length=ship_info["dim"][0],
                width=ship_info["dim"][1],
                height=ship_info["dim"][2],
                description=ship_info["desc"]
            )
            db.add(item)

        await db.commit()
        print("Successfully added 10 realistic locations and 10 realistic shipments.")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_realistic_data())
