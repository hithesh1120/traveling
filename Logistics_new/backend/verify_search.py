
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PWD = "password123"

async def verify_search():
    print(f"Connecting to {BASE_URL}...")
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login
        print("Logging in...")
        try:
            resp = await client.post("/token", data={"username": ADMIN_EMAIL, "password": ADMIN_PWD})
        except httpx.ConnectError:
            print("Connection failed. Is the server running?")
            return False
            
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            # Try to register if login fails (maybe db reset)
            print("Login failed, assuming DB reset. Need seeding or existing admin.")
            return False
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Search Global (Shipment)
        print("Testing Global Search (Shipment)...")
        # Search for 'SHIP' or something likely to exist
        resp = await client.get("/search/global?q=SHIP", headers=headers)
        if resp.status_code != 200:
            print(f"Search failed: {resp.text}")
            return False
        data = resp.json()
        print(f"Global Search 'SHIP': Found {len(data['shipments'])} shipments, {len(data['drivers'])} drivers, {len(data['vehicles'])} vehicles")
        
        # 3. Search Global (Driver)
        print("Testing Global Search (Driver)...")
        resp = await client.get("/search/global?q=driver", headers=headers) 
        data = resp.json()
        print(f"Global Search 'driver': Found {len(data['drivers'])} drivers")

        # 4. Filter Shipments
        print("Testing Shipment Filters (Status=PENDING)...")
        resp = await client.get("/shipments?status=PENDING", headers=headers)
        if resp.status_code != 200:
            print(f"Filter failed: {resp.text}")
            return False
        shipments = resp.json()
        print(f"Found {len(shipments)} PENDING shipments")
        
        # 5. Filter Vehicles
        print("Testing Vehicle Filters...")
        resp = await client.get("/vehicles", headers=headers) 
        if resp.status_code != 200:
            print(f"Vehicle list failed: {resp.text}")
            # It might be 403 if we are not admin, but we logged in as admin
            return False
        vehicles = resp.json()
        print(f"Found {len(vehicles)} vehicles")

        # 6. Search primarily by PO Number
        print("Testing PO Number Search...")
        resp = await client.get("/search/global?q=PO-DELAYED", headers=headers)
        data = resp.json()
        print(f"Global Search 'PO-DELAYED': Found {len(data['shipments'])} shipments")
        if len(data['shipments']) == 0:
            print("FAILED: PO Number search returned no results")
            return False

        # 7. Search by Sender Name
        print("Testing Sender Name Search...")
        resp = await client.get("/search/global?q=MSME", headers=headers)
        data = resp.json()
        print(f"Global Search 'MSME': Found {len(data['shipments'])} shipments")
        
        # 8. Test Delayed Filter
        print("Testing Delayed Filter...")
        resp = await client.get("/shipments?delayed=true", headers=headers)
        if resp.status_code != 200:
             print(f"Delayed filter failed: {resp.text}")
             return False
        delayed_ships = resp.json()
        print(f"Found {len(delayed_ships)} delayed shipments")
        if len(delayed_ships) == 0:
            print("WARNING: Expected at least 1 delayed shipment")

        print("Verification PASSED")
        return True

if __name__ == "__main__":
    try:
        if not asyncio.run(verify_search()):
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
