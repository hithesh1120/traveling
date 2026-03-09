import urllib.request
import urllib.parse
import json
import uuid

def main():
    base_url = "http://localhost:8000"
    
    # 1. Login
    login_data = urllib.parse.urlencode({"username": "admin@example.com", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/token", data=login_data)
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode("utf-8"))["access_token"]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Create Shipment
    shipment_data = {
        "pickup_address": "Test Warehouse",
        "pickup_contact": "Test Contact",
        "pickup_phone": "1234567890",
        "drop_address": "Customer Site A",
        "drop_contact": "John Doe",
        "drop_phone": "0987654321",
        "total_weight": 10.5,
        "total_volume": 1.2,
        "po_number": f"PO-{uuid.uuid4().hex[:6].upper()}",
        "items": [
            {
                "name": "Widget A",
                "quantity": 5,
                "weight": 2.1,
                "length": 0.5,
                "width": 0.5,
                "height": 0.5
            }
        ]
    }
    
    print(f"Creating shipment with PO: {shipment_data['po_number']}")
    req = urllib.request.Request(f"{base_url}/shipments", data=json.dumps(shipment_data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print("Status code:", resp.getcode())
            body = json.loads(resp.read().decode("utf-8"))
            print("Response:", body)
            print("\nSUCCESS: Order created and serialized correctly.")
    except Exception as e:
        print("ERROR during order creation:")
        if hasattr(e, 'read'):
            print(e.read().decode())
        else:
            print(e)

if __name__ == "__main__":
    main()
