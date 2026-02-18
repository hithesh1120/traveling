
import asyncio
import sys
import os

# Add current directory to path so we can import modules
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import (User, UserRole, Vendor, Dock, DockType,
                    Vehicle, VehicleType, Zone, Shipment, ShipmentStatus, ShipmentItem)
from auth import get_password_hash
from database import DATABASE_URL, Base
from sqlalchemy import select
from datetime import datetime, timedelta
import random

# Use the same database URL as the main app
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    # Create all tables first (including new ones)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created/verified.")
    
    async with AsyncSessionLocal() as db:
        print("Seeding data...")

        # 1. Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        if result.scalars().first():
            print("Base data already seeded. Checking new roles...")
            
            # Seed new roles if missing
            await seed_new_roles(db)
            await seed_vehicles_and_zones(db)
            return

        # First, create a Vendor Entry for the vendor user
        vendor_entry = Vendor(
            name="Acme Global Supplies", 
            contact_email="contact@acme.com", 
            contact_phone="555-0100", 
            address="123 Plant Road", 
            gst_number="22AAAAA0000A1Z5"
        )
        db.add(vendor_entry)
        await db.flush() # Get ID
        
        # Create Users (original + new roles)
        users_to_create = [
            {"email": "admin@example.com", "password": "password123", "role": UserRole.SUPER_ADMIN, "name": "System Admin"},
            {"email": "vendor@example.com", "password": "password123", "role": UserRole.VENDOR, "name": "Acme Supplies (Sender)"},
            # --- NEW ENTERPRISE ROLES ---
            {"email": "msme@example.com", "password": "password123", "role": UserRole.MSME, "name": "MSME Business User"},
            {"email": "driver@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Raj", "license": "DL-KA01-2023001", "rating": 4.8, "phone": "9876543210"},
            {"email": "driver2@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Suresh", "license": "DL-KA04-2023999", "rating": 3.9, "phone": "9123456789"},
            {"email": "driver2@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Suresh", "license": "DL-KA04-2023999", "rating": 3.9, "phone": "9123456789"},
        ]
        
        for u in users_to_create:
            hashed = get_password_hash(u["password"])
            vid = vendor_entry.id if u["role"] == UserRole.VENDOR else None
            
            new_user = User(
                email=u["email"],
                hashed_password=hashed,
                role=u["role"],
                name=u["name"],
                vendor_id=vid,
                license_number=u.get("license"),
                rating=u.get("rating", 5.0),
                phone=u.get("phone")
            )
            db.add(new_user)
            print(f"Created user: {u['email']}")

        # Docks removed for Logistics Only Platform
        # docks = []
        
        # for d in docks:
            # new_dock = Dock(name=d['name'], dock_type=d['type'])
            # db.add(new_dock)
            # print(f"Created dock: {d['name']}")

        try:
            await db.commit()
            print("Base seeding complete.")
        except Exception as e:
            print(f"Error seeding data: {e}")
            await db.rollback()
            return

        # Now seed vehicles and zones
        await seed_vehicles_and_zones(db)
        await seed_shipments(db)


async def seed_new_roles(db):
    """Add new role users if they don't exist yet."""
    new_users = [
        {"email": "msme@example.com", "password": "password123", "role": UserRole.MSME, "name": "MSME Business User"},
        {"email": "driver@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Raj"},
        {"email": "driver2@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Suresh"},
        {"email": "driver2@example.com", "password": "password123", "role": UserRole.DRIVER, "name": "Driver Suresh"},
    ]
    
    for u in new_users:
        result = await db.execute(select(User).where(User.email == u["email"]))
        if not result.scalars().first():
            hashed = get_password_hash(u["password"])
            new_user = User(email=u["email"], hashed_password=hashed, role=u["role"], name=u["name"])
            db.add(new_user)
            print(f"Created new user: {u['email']}")
    
    try:
        await db.commit()
        print("New roles seeded.")
    except Exception as e:
        print(f"Error seeding new roles: {e}")
        await db.rollback()


async def seed_vehicles_and_zones(db):
    """Add sample vehicles and zones if they don't exist."""
    # Check if vehicles already exist
    result = await db.execute(select(Vehicle))
    if result.scalars().first():
        print("Vehicles already exist. Skipping.")
        return

    # Get driver IDs
    drv1 = await db.execute(select(User).where(User.email == "driver@example.com"))
    drv1_user = drv1.scalars().first()
    drv2 = await db.execute(select(User).where(User.email == "driver2@example.com"))
    drv2_user = drv2.scalars().first()

    # Create zones
    zones = [
        Zone(name="North Zone", description="Northern district coverage", 
             color="#1890ff", coordinates=[[77.55, 12.98], [77.55, 13.05], [77.65, 13.05], [77.65, 12.98]]),
        Zone(name="South Zone", description="Southern district coverage", 
             color="#52c41a", coordinates=[[77.55, 12.90], [77.55, 12.98], [77.65, 12.98], [77.65, 12.90]]),
        Zone(name="East Zone", description="Eastern district coverage", 
             color="#fa8c16", coordinates=[[77.65, 12.90], [77.65, 13.05], [77.75, 13.05], [77.75, 12.90]]),
    ]
    
    for z in zones:
        db.add(z)
    await db.flush()
    
    # Create vehicles
    vehicles = [
        Vehicle(name="Truck-01", plate_number="KA-01-AB-1234", vehicle_type=VehicleType.TRUCK,
                weight_capacity=5000, volume_capacity=25.0, 
                current_driver_id=drv1_user.id if drv1_user else None, zone_id=zones[0].id),
        Vehicle(name="Van-01", plate_number="KA-01-CD-5678", vehicle_type=VehicleType.VAN,
                weight_capacity=1500, volume_capacity=8.0,
                current_driver_id=drv2_user.id if drv2_user else None, zone_id=zones[1].id),
        Vehicle(name="Truck-02", plate_number="KA-02-EF-9012", vehicle_type=VehicleType.TRUCK,
                weight_capacity=8000, volume_capacity=40.0, zone_id=zones[2].id),
        Vehicle(name="Pickup-01", plate_number="KA-03-GH-3456", vehicle_type=VehicleType.PICKUP,
                weight_capacity=800, volume_capacity=4.0, zone_id=zones[0].id),
    ]
    
    for v in vehicles:
        db.add(v)
    
    try:
        await db.commit()
        print("Vehicles and zones seeded.")
    except Exception as e:
        print(f"Error seeding vehicles/zones: {e}")
        await db.rollback()


async def seed_shipments(db):
    """Seed sample shipments"""
    # Check if shipments exist
    result = await db.execute(select(Shipment))
    if result.scalars().first():
        return

    # Get users
    sender_res = await db.execute(select(User).where(User.role == UserRole.MSME))
    sender = sender_res.scalars().first()
    
    driver_res = await db.execute(select(User).where(User.role == UserRole.DRIVER))
    driver = driver_res.scalars().first()
    
    if not sender: return

    shipments = [
        {
            "tracking": "SHP-RECENT-001",
            "po": "PO-NORMAL-1",
            "status": ShipmentStatus.PENDING,
            "created": datetime.utcnow(),
            "desc": "Standard delivery"
        },
        {
            "tracking": "SHP-DELAYED-999",
            "po": "PO-DELAYED-X",
            "status": ShipmentStatus.ASSIGNED,
            "created": datetime.utcnow() - timedelta(days=2),
            "driver_id": driver.id if driver else None,
            "desc": "Late shipment"
        }
    ]

    for s in shipments:
        ship = Shipment(
            tracking_number=s["tracking"],
            po_number=s["po"],
            sender_id=sender.id,
            pickup_address="123 Origin St",
            drop_address="456 Dest Rd",
            total_weight=100,
            total_volume=10,
            status=s["status"],
            description=s["desc"],
            assigned_driver_id=s.get("driver_id"),
            created_at=s["created"]
        )
        db.add(ship)
    
    try:
        await db.commit()
        print("Shipments seeded.")
    except Exception as e:
        print(f"Error seeding shipments: {e}")
        await db.rollback()


if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_data())
