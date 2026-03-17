"""
reseed_clean.py
Clears all operational data (shipments, addresses, vehicles, notifications, audit_logs)
while PRESERVING user accounts and companies, then seeds 10 real locations + shipments.
"""

import asyncio
import sys
import os
import uuid
import random
from datetime import datetime, timedelta

sys.path.append(os.getcwd())

from sqlalchemy import text, select
from database import AsyncSessionLocal, engine
from models import (
    User, UserRole, Company, Shipment, ShipmentStatus,
    ShipmentItem, SavedAddress, Vehicle, VehicleStatus, VehicleType
)

# ─── 10 Real Industrial Locations ─────────────────────────────────────────────
REAL_LOCATIONS = [
    {
        "label": "Peenya Manufacturing Hub",
        "address": "Shed No. 14, 8th Cross, Peenya Industrial Area, Bengaluru – 560 058",
        "lat": 13.0285, "lng": 77.5195,
        "contact": "Rajesh Kulkarni", "phone": "+91 98450 11223"
    },
    {
        "label": "Whitefield Export Zone",
        "address": "Plot 22, KIADB Export Promotion Industrial Area, Whitefield, Bengaluru – 560 066",
        "lat": 12.9698, "lng": 77.7500,
        "contact": "Priya Nair", "phone": "+91 99001 44556"
    },
    {
        "label": "Electronic City Tech Park",
        "address": "Phase 1, Electronics City, Hosur Road, Bengaluru – 560 100",
        "lat": 12.8452, "lng": 77.6632,
        "contact": "Arun Menon", "phone": "+91 97420 78901"
    },
    {
        "label": "Bommasandra Steel Yard",
        "address": "Survey No. 67, Bommasandra Industrial Area, Anekal Taluk, Bengaluru – 562 158",
        "lat": 12.8164, "lng": 77.6914,
        "contact": "D. Venkatesh", "phone": "+91 96320 34567"
    },
    {
        "label": "Jigani Granite Cluster",
        "address": "Block C, Jigani Industrial Area, Anekal, Bengaluru – 560 105",
        "lat": 12.7844, "lng": 77.6322,
        "contact": "Suresh Babu", "phone": "+91 94480 22334"
    },
    {
        "label": "Cherlapally Pharma Hub",
        "address": "IDA Cherlapally, Phase II, Hyderabad – 500 051",
        "lat": 17.4728, "lng": 78.6000,
        "contact": "K. Ramakrishna", "phone": "+91 98490 55667"
    },
    {
        "label": "Pashamylaram Metal Works",
        "address": "TSIIC Industrial Area, Pashamylaram, Medak, Telangana – 502 307",
        "lat": 17.5300, "lng": 78.1800,
        "contact": "Srinivas Reddy", "phone": "+91 99594 66778"
    },
    {
        "label": "Balanagar Precision Estate",
        "address": "H.No. 3-201, IDA Balanagar, Hyderabad – 500 037",
        "lat": 17.4700, "lng": 78.4500,
        "contact": "Anwar Hussain", "phone": "+91 93910 77889"
    },
    {
        "label": "Sanathnagar Logistics Park",
        "address": "Plot 45, IDA Sanathnagar Phase V, Hyderabad – 500 018",
        "lat": 17.4500, "lng": 78.4300,
        "contact": "Padmavathi Devi", "phone": "+91 96004 88990"
    },
    {
        "label": "Jeedimetla Industrial Cluster",
        "address": "Shed 8C, IDA Jeedimetla, Quthbullapur, Hyderabad – 500 055",
        "lat": 17.5100, "lng": 78.4600,
        "contact": "Mohammed Farooq", "phone": "+91 91000 99001"
    },
]

# ─── 10 Real Shipment Payloads ─────────────────────────────────────────────────
REAL_SHIPMENTS = [
    {"name": "Precision Roller Bearings (SKF)",     "weight": 5.0,  "qty": 20, "dim": (0.25, 0.25, 0.18), "desc": "FAG/SKF precision roller bearings 6205-2RS, batch #BLR-2024-03"},
    {"name": "MS Steel Fabrication Brackets",        "weight": 80.0, "qty": 6,  "dim": (1.0,  0.6,  0.4),  "desc": "MS welded channel brackets, Grade FE410, heat-treated"},
    {"name": "Siemens Control Panel (MCC)",          "weight": 95.0, "qty": 2,  "dim": (1.2,  0.8,  1.6),  "desc": "Motor Control Centre switchgear, 415V 3-phase, tested"},
    {"name": "SERVO Hydraulic Oil (ISO 46)",         "weight": 18.0, "qty": 8,  "dim": (0.4,  0.4,  0.55), "desc": "20L drums of SERVO Hydraulic 46VG, batch S-HYD-25-22"},
    {"name": "Mono Carton Packaging Rolls",          "weight": 35.0, "qty": 4,  "dim": (0.6,  0.6,  1.2),  "desc": "300 GSM corrugated mono carton rolls, FDA-grade"},
    {"name": "Combed Cotton Yarn (30s Ne)",          "weight": 50.0, "qty": 8,  "dim": (0.8,  0.8,  0.9),  "desc": "Premier Mills 30s Ne combed cotton yarn, 5 kg cones"},
    {"name": "Bosch Fuel Injectors (CR)",            "weight": 6.0,  "qty": 12, "dim": (0.35, 0.2,  0.2),  "desc": "Common-rail Bosch injectors part# 0445110376, OEM"},
    {"name": "Waaree Solar Panels (440W)",           "weight": 22.0, "qty": 10, "dim": (1.72, 1.13, 0.03), "desc": "Monocrystalline PERC 440W, IEC 61215 certified"},
    {"name": "Alum Sulphate (ETP grade)",            "weight": 50.0, "qty": 4,  "dim": (0.5,  0.5,  0.65), "desc": "Aluminium Sulphate 17% Al₂O₃, 50 kg HDPE bags, ETP use"},
    {"name": "JK Copier A4 Paper (75 GSM)",         "weight": 25.0, "qty": 6,  "dim": (0.33, 0.22, 0.28), "desc": "JK Copier Plus, 500-sheet reams × 10 per box, ream-wrapped"},
]

async def reseed():
    async with AsyncSessionLocal() as db:
        print("=== Step 1: Clearing operational tables ===")
        tables = [
            "shipment_items", "delivery_receipts", "shipment_timeline",
            "shipments", "audit_logs", "notifications",
            "saved_addresses", "vehicles"
        ]
        for t in tables:
            try:
                await db.execute(text(f"DELETE FROM {t}"))
                print(f"  Cleared: {t}")
            except Exception as e:
                print(f"  Skip {t}: {e}")
        await db.commit()
        print("  ✓ Operational data cleared (users/companies preserved)")

        print("\n=== Step 2: Fetching users ===")
        msme_res = await db.execute(select(User).where(User.role == UserRole.MSME))
        msme_user = msme_res.scalars().first()
        admin_res = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        admin_user = admin_res.scalars().first()
        driver_res = await db.execute(select(User).where(User.role == UserRole.DRIVER))
        driver_user = driver_res.scalars().first()

        if not msme_user:
            print("  ✗ No MSME user found. Aborting."); return
        comp_res = await db.execute(select(Company).where(Company.id == msme_user.company_id))
        my_company = comp_res.scalars().first()
        user_hq = my_company.address if my_company and my_company.address else "123 Main St, Bangalore"
        user_lat = my_company.lat if my_company and my_company.lat else 12.9716
        user_lng = my_company.lng if my_company and my_company.lng else 77.5946

        print(f"  MSME User : {msme_user.email}")
        print(f"  HQ address: {user_hq}")

        print("\n=== Step 3: Adding 3 fleet vehicles ===")
        fleet = [
            Vehicle(name="Tata LPT 1613 (Truck-01)", plate_number="KA-01-AB-1234",
                    vehicle_type=VehicleType.TRUCK, weight_capacity=10000, volume_capacity=40,
                    status=VehicleStatus.AVAILABLE,
                    current_driver_id=driver_user.id if driver_user else None,
                    company_id=admin_user.company_id if admin_user and admin_user.company_id else None),
            Vehicle(name="Ace HT Mini Truck (Van-01)", plate_number="KA-01-CD-5678",
                    vehicle_type=VehicleType.VAN, weight_capacity=1500, volume_capacity=8,
                    status=VehicleStatus.AVAILABLE,
                    company_id=admin_user.company_id if admin_user and admin_user.company_id else None),
            Vehicle(name="Mahindra Bolero Pickup (PU-01)", plate_number="KA-03-GH-3456",
                    vehicle_type=VehicleType.PICKUP, weight_capacity=800, volume_capacity=4,
                    status=VehicleStatus.AVAILABLE,
                    company_id=admin_user.company_id if admin_user and admin_user.company_id else None),
        ]
        for v in fleet:
            db.add(v)

        print("\n=== Step 4: Adding 10 real locations ===")
        saved_addrs = []
        for loc in REAL_LOCATIONS:
            addr = SavedAddress(
                user_id=msme_user.id,
                label=loc["label"],
                address=loc["address"],
                lat=loc["lat"], lng=loc["lng"],
                is_global=True
            )
            db.add(addr)
            saved_addrs.append(loc)
            print(f"  ✓ {loc['label']}")

        await db.flush()

        print("\n=== Step 5: Adding 10 real shipments ===")
        statuses = [ShipmentStatus.PENDING] * 6 + [ShipmentStatus.ASSIGNED] * 2 + [ShipmentStatus.IN_TRANSIT] * 2
        random.shuffle(statuses)

        for i, (ship_info, loc) in enumerate(zip(REAL_SHIPMENTS, REAL_LOCATIONS)):
            tracking = f"SHP-{uuid.uuid4().hex[:10].upper()}"
            po = f"PO-BLR-{2025 + i:04d}"
            is_collection = i % 2 == 0  # alternate collection / delivery

            if is_collection:
                pu_addr, pu_lat, pu_lng = loc["address"], loc["lat"], loc["lng"]
                dr_addr, dr_lat, dr_lng = user_hq, user_lat, user_lng
                order_type = "Collection"
            else:
                pu_addr, pu_lat, pu_lng = user_hq, user_lat, user_lng
                dr_addr, dr_lat, dr_lng = loc["address"], loc["lat"], loc["lng"]
                order_type = "Delivery"

            w = ship_info["weight"] * ship_info["qty"]
            vol = ship_info["dim"][0] * ship_info["dim"][1] * ship_info["dim"][2] * ship_info["qty"]

            shipment = Shipment(
                tracking_number=tracking,
                po_number=po,
                sender_id=msme_user.id,
                pickup_address=pu_addr, pickup_lat=pu_lat, pickup_lng=pu_lng, pickup_contact=loc["contact"],
                drop_address=dr_addr, drop_lat=dr_lat, drop_lng=dr_lng, drop_contact=my_company.name if my_company else "-",
                total_weight=w, total_volume=round(vol, 4),
                description=f"PO: {po} | Order Type: {order_type} | Item: {ship_info['name']} | Requested By: {msme_user.name}",
                status=statuses[i],
                created_at=datetime.utcnow() - timedelta(hours=i * 5 + random.randint(1, 4))
            )
            db.add(shipment)
            await db.flush()

            item = ShipmentItem(
                shipment_id=shipment.id,
                name=ship_info["name"], quantity=ship_info["qty"],
                weight=ship_info["weight"],
                length=ship_info["dim"][0], width=ship_info["dim"][1], height=ship_info["dim"][2],
                description=ship_info["desc"]
            )
            db.add(item)
            print(f"  ✓ [{order_type}] {tracking} — {ship_info['name']}")

        await db.commit()
        print("\n✅ Done! 10 locations + 10 shipments + 3 vehicles added. Users preserved.")

if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reseed())
