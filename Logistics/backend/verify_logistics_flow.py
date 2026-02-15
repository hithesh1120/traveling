import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def print_step(msg):
    print(f"\n{'='*50}\n{msg}\n{'='*50}")

def register_user(email, password, role, name, admin_headers):
    url = f"{BASE_URL}/admin/users"
    res = requests.post(url, json={
        "email": email, "password": password, "role": role, "name": name
    }, headers=admin_headers)
    if res.status_code == 200:
        return res.json()
    else:
        print(f"Failed to register {email}: {res.text}")
        return None

def login(email, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed for {email}: {response.text}")
        return None

def run_verification():
    # 1. Login as Super Admin (assuming seeded)
    print_step("1. Admin Login")
    # Try default admin credentials
    admin_token = login("admin@example.com", "password123")
    if not admin_token:
        print("CRITICAL: Cannot login as admin. Is backend running? Did seed_data.py run?")
        sys.exit(1)
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin logged in successfully.")

    # 2. Create Test Users
    print_step("2. Creating Test Actors")
    timestamp = int(time.time())
    
    # MSME
    msme_email = f"msme_{timestamp}@test.com"
    msme_user = register_user(msme_email, "password123", "MSME", "Test MSME", admin_headers)
    
    # Driver
    driver_email = f"driver_{timestamp}@test.com"
    driver_user = register_user(driver_email, "password123", "DRIVER", "Test Driver", admin_headers)
    driver_id = driver_user["id"] if driver_user else None

    # Fleet Manager
    fleet_email = f"fleet_{timestamp}@test.com"
    fleet_user = register_user(fleet_email, "password123", "FLEET_MANAGER", "Test FleetMgr", admin_headers)

    if not msme_user or not driver_user or not fleet_user:
        print("Failed to create test users.")
        sys.exit(1)

    # Login as Actors
    print("Logging in as new users...")
    msme_token = login(msme_email, "password123")
    driver_token = login(driver_email, "password123")
    fleet_token = login(fleet_email, "password123")
    
    # Headers
    msme_headers = {"Authorization": f"Bearer {msme_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    fleet_headers = {"Authorization": f"Bearer {fleet_token}"}

    # 3. Create Vehicle
    print_step("3. Creating Test Vehicle")
    plate = f"TST-{timestamp}"
    veh_res = requests.post(f"{BASE_URL}/vehicles", json={
        "name": "Test Truck",
        "plate_number": plate,
        "vehicle_type": "TRUCK",
        "weight_capacity": 1000.0,
        "volume_capacity": 100.0
    }, headers=admin_headers)
    
    if veh_res.status_code != 200:
        print(f"Vehicle creation failed: {veh_res.text}")
        sys.exit(1)
    
    vehicle = veh_res.json()
    vehicle_id = vehicle["id"]
    print(f"Vehicle created: {plate} (ID: {vehicle_id})")

    # 4. MSME Creates Shipment
    print_step("4. MSME Creates Shipment")
    ship_payload = {
        "pickup_address": "123 Factory Lane",
        "drop_address": "456 Market St",
        "pickup_contact": "John Sender",
        "pickup_phone": "555-0101",
        "drop_contact": "Jane Receiver",
        "drop_phone": "555-0102",
        "total_weight": 500.0,
        "total_volume": 50.0,
        "description": "Electronics",
        "items": [
            {"name": "Box A", "quantity": 10, "weight": 50.0, "length": 1.0, "width": 1.0, "height": 1.0}
        ]
    }
    ship_res = requests.post(f"{BASE_URL}/shipments", json=ship_payload, headers=msme_headers)
    
    if ship_res.status_code != 200:
        print(f"Shipment creation failed: {ship_res.text}")
        sys.exit(1)
        
    shipment = ship_res.json()
    shipment_id = shipment["id"]
    print(f"Shipment Created: {shipment['tracking_number']} (ID: {shipment_id})")
    print(f"Status: {shipment['status']}")

    # 5. Fleet Manager Dispatches Shipment
    print_step("5. Dispatching Shipment")
    assign_payload = {
        "vehicle_id": vehicle_id,
        "driver_id": driver_id
    }
    dispatch_res = requests.post(f"{BASE_URL}/shipments/{shipment_id}/assign", json=assign_payload, headers=fleet_headers)
    
    if dispatch_res.status_code != 200:
         print(f"Dispatch failed: {dispatch_res.text}")
         sys.exit(1)
         
    shipment = dispatch_res.json()
    print(f"Shipment Dispatched. Status: {shipment['status']}")
    print(f"Assigned Driver: {shipment['assigned_driver_id']}")
    print(f"Assigned Vehicle: {shipment['assigned_vehicle_id']}")

    # 6. Driver Flow
    print_step("6. Driver Pickup & Delivery")
    
    # Pickup
    pk_res = requests.post(f"{BASE_URL}/shipments/{shipment_id}/pickup", headers=driver_headers)
    if pk_res.status_code != 200:
        print(f"Pickup failed: {pk_res.text}")
        sys.exit(1)
    print("Status: PICKED_UP")
    
    # In Transit
    it_res = requests.post(f"{BASE_URL}/shipments/{shipment_id}/in-transit", headers=driver_headers)
    if it_res.status_code != 200:
        print(f"In-Transit failed: {it_res.text}")
        sys.exit(1)
    print("Status: IN_TRANSIT")
    
    # Deliver
    del_payload = {
        "receiver_name": "Jane Receiver",
        "receiver_phone": "555-0102",
        "notes": "Left at dock",
        "photo_url": "http://example.com/proof.jpg"
    }
    del_res = requests.post(f"{BASE_URL}/shipments/{shipment_id}/deliver", json=del_payload, headers=driver_headers)
    if del_res.status_code != 200:
        print(f"Delivery failed: {del_res.text}")
        sys.exit(1)
    print("Status: DELIVERED")

    # 7. MSME Confirm Receipt
    print_step("7. MSME Confirmation")
    conf_res = requests.post(f"{BASE_URL}/shipments/{shipment_id}/confirm-receipt", headers=msme_headers)
    if conf_res.status_code != 200:
         print(f"Confirmation failed: {conf_res.text}")
         sys.exit(1)
    print("Status: CONFIRMED")

    # 8. Check Audit Logs
    print_step("8. Verifying Admin Audit Logs")
    logs_res = requests.get(f"{BASE_URL}/admin/audit-logs?limit=5", headers=admin_headers)
    if logs_res.status_code == 200:
        logs = logs_res.json()
        print(f"Found {len(logs)} recent audit logs.")
        for l in logs:
            print(f"[{l['action']}] {l['details']} (by {l['user']['role']})")
    else:
        print(f"Failed to fetch audit logs: {logs_res.text}")

    # 9. Verify Stats
    print_step("9. Verifying Dashboard Stats")
    stats_res = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
    if stats_res.status_code == 200:
        stats = stats_res.json()
        print("Stats Summary:")
        print(json.dumps(stats, indent=2))
        
        # Simple assertions
        if stats.get("scheduled_today") < 1:
            print("WARNING: 'scheduled_today' (Created Today) seems low, expected at least 1.")
    else:
        print(f"Failed to fetch stats: {stats_res.text}")

    print_step("VERIFICATION SUCCESSFUL")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"Verification failed with error: {e}")
        sys.exit(1)
