import urllib.request
import urllib.parse
import json

def main():
    base_url = "http://localhost:8000"
    
    # 1. Login as Admin
    login_data = urllib.parse.urlencode({"username": "admin@example.com", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/token", data=login_data)
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode("utf-8"))["access_token"]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Get a pending shipment
    with urllib.request.urlopen(urllib.request.Request(f"{base_url}/shipments?status=PENDING", headers=headers)) as resp:
        shipments = json.loads(resp.read().decode("utf-8"))
        if not shipments:
            print("No pending shipments found to test assignment.")
            return
        shipment_id = shipments[0]["id"]
    
    # 3. Get an available vehicle with a driver
    with urllib.request.urlopen(urllib.request.Request(f"{base_url}/vehicles", headers=headers)) as resp:
        vehicles = json.loads(resp.read().decode("utf-8"))
        target_vehicle = None
        for v in vehicles:
            if v["current_driver_id"]:
                target_vehicle = v
                break
        
        if not target_vehicle:
            print("No vehicles with drivers found to test assignment.")
            return

    # 4. Attempt Manual Assignment
    assign_url = f"{base_url}/shipments/{shipment_id}/assign"
    assign_data = {
        "vehicle_id": target_vehicle["id"],
        "driver_id": target_vehicle["current_driver_id"]
    }
    
    print(f"Assigning shipment {shipment_id} to vehicle {target_vehicle['plate_number']} and driver {target_vehicle['current_driver_id']}")
    
    try:
        req = urllib.request.Request(assign_url, data=json.dumps(assign_data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            print("Status code:", resp.getcode())
            body = json.loads(resp.read().decode("utf-8"))
            print("Response status:", body["status"])
            if body["status"] == "ASSIGNED":
                print("SUCCESS: Order assigned manually.")
            else:
                print(f"FAILED: Status is {body['status']} instead of ASSIGNED")
    except Exception as e:
        print("ERROR during assignment:")
        if hasattr(e, 'read'):
            print(e.read().decode())
        else:
            print(e)

if __name__ == "__main__":
    main()
