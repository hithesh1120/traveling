import asyncio
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database import DATABASE_URL
import models
import schemas

# Use the same database URL as the main app
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def verify_search():
    async with AsyncSessionLocal() as db:
        print("--- Verifying Search V2 ---")

        # 1. Verify Phone Search (Driver)
        print("\n1. Testing Driver Phone Search (9876543210)...")
        # We need to hit the endpoint, not just DB, but for unit test script we can simulate or just use DB query logic check
        # ideally we use httpx to hit the running server or just test the query logic.
        # Let's test the endpoint using httpx
        
        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            # Login as Admin to search drivers
            auth_res = await client.post("/token", data={"username": "admin@example.com", "password": "password123"})
            if auth_res.status_code != 200:
                print("FAILED: Could not login as admin", auth_res.text)
                return
            token = auth_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Search Driver Phone
            res = await client.get("/search/global?q=9876", headers=headers)
            data = res.json()
            drivers = data.get("drivers", [])
            print(f"Search '9876' found {len(drivers)} drivers.")
            
            found_raj = any(d["phone"] == "9876543210" for d in drivers)
            if found_raj:
                print("PASSED: Found Driver Raj by phone.")
            else:
                print("FAILED: Did not find Driver Raj by phone.")

            # Search Shipment by Contact Phone (if any seeded)
            # note: seed data usually doesn't put phones in shipment contact fields yet, 
            # but we can try creating one.
            
            # Create a shipment with phone numbers
            shipment_data = {
                "pickup_address": "123 Phone St",
                "drop_address": "456 Call Ave",
                "pickup_contact": "Mr. Pickup",
                "pickup_phone": "555-1234",
                "drop_contact": "Ms. Drop",
                "drop_phone": "555-5678",
                "total_weight": 100,
                "total_volume": 10,
                "items": [{"name": "Phone", "quantity": 1}]
            }
            # Login as MSME to create shipment
            auth_msme = await client.post("/token", data={"username": "msme@example.com", "password": "password123"})
            token_msme = auth_msme.json()["access_token"]
            
            create_res = await client.post("/shipments", json=shipment_data, headers={"Authorization": f"Bearer {token_msme}"})
            if create_res.status_code == 200:
                print("Shipment created with phone numbers.")
                # Search for it
                res_shp = await client.get("/search/global?q=555-1234", headers=headers) # Admin search
                ships = res_shp.json().get("shipments", [])
                if any(s["pickup_address"] == "123 Phone St" for s in ships):
                    print("PASSED: Found shipment by pickup_phone.")
                else:
                    print("FAILED: Did not find shipment by pickup_phone.")
            else:
                print("FAILED: Could not create shipment", create_res.text)

if __name__ == "__main__":
    asyncio.run(verify_search())
