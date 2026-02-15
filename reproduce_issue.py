import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Login
resp = requests.post(f"{BASE_URL}/token", data={"username": "admin@logisoft.com", "password": "securepassword"})
if resp.status_code != 200:
    print("Login Failed", resp.text)
    # Try creating admin if not exists? Assuming admin exists from previous steps. 
    # If not, I'll need to create one.
    # Let's assume standard admin credentials or create one.
    # Actually, I don't know the current DB state.
    # I'll try to signup a new admin if login fails? No, can't signup as admin easily.
    # I'll try the credentials I set in `create_admin.py` or similar if I did.
    # I didn't create a persistent admin script? I might have done it manually.
    # I'll try standard test credentials.
    pass

token = resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Create Zone
zone_data = {
    "name": "Debug Zone 1",
    "coordinates": [
        [12.9, 77.5],
        [12.9, 77.7],
        [13.1, 77.7],
        [13.1, 77.5],
        [12.9, 77.5] # Closed loop
    ]
}
z_resp = requests.post(f"{BASE_URL}/zones", json=zone_data, headers=headers)
print("Create Zone:", z_resp.status_code)
if z_resp.status_code == 200:
    zone_id = z_resp.json()['id']
else:
    # Fetch existing
    print("Fetching existing zones...")
    zones = requests.get(f"{BASE_URL}/zones", headers=headers).json()
    debug_zone = next((z for z in zones if z['name'] == "Debug Zone 1"), None)
    if debug_zone:
        zone_id = debug_zone['id']
    else:
        print("Zone creation failed and not found")
        exit(1)

# 3. Create Vehicle
veh_data = {
    "vehicle_number": "KA-DEBUG-01",
    "max_volume_m3": 100.0,
    "max_weight_kg": 1000.0,
    "zone_id": zone_id
}
v_resp = requests.post(f"{BASE_URL}/vehicles", json=veh_data, headers=headers)
print("Create Vehicle:", v_resp.status_code, v_resp.text)
if v_resp.status_code != 200:
    # Maybe already exists, try to continue
    pass

# 4. Create Order (Using MSME flow? Or Admin can create? Admin matches user_id logic?)
# Admin login is User. So Admin can create order for himself.
order_data = {
    "item_name": "Debug Item",
    "length_cm": 10,
    "width_cm": 10,
    "height_cm": 10,
    "weight_kg": 50,
    "latitude": 13.0, # Inside 12.9-13.1
    "longitude": 77.6
}
o_resp = requests.post(f"{BASE_URL}/orders", json=order_data, headers=headers)
print("Create Order:", o_resp.status_code, o_resp.text)
order_id = o_resp.json()['id']

# 5. Check Compatibility
c_resp = requests.get(f"{BASE_URL}/orders/{order_id}/compatible-vehicles", headers=headers)
print("Compatible Vehicles:", c_resp.status_code, c_resp.json())
