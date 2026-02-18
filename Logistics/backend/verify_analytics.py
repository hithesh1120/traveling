
import requests
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASS = "password123"

def login(email, password):
    res = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login failed: {res.text}")
    sys.exit(1)

def verify_analytics():
    print("1. Logging in as Admin...")
    token = login(ADMIN_EMAIL, ADMIN_PASS)
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Fleet Analytics
    print("\n2. Testing /analytics/fleet...")
    fleet_res = requests.get(f"{BASE_URL}/analytics/fleet", headers=headers)
    if fleet_res.status_code == 200:
        data = fleet_res.json()
        print("SUCCESS: Fleet data received")
        print(f"  Total Vehicles: {data['total_vehicles']}")
        print(f"  Utilization: {data['utilization_rate']}%")
    else:
        print(f"FAILURE: Failed to fetch fleet analytics. Status: {fleet_res.status_code}")
        print(fleet_res.text)

    # Verify Shipment Analytics
    print("\n3. Testing /analytics/shipments...")
    ship_res = requests.get(f"{BASE_URL}/analytics/shipments", headers=headers)
    if ship_res.status_code == 200:
        data = ship_res.json()
        print("SUCCESS: Shipment data received")
        print(f"  Total Shipments: {data['total']}")
        print(f"  Today: {data['today']}")
        print(f"  Chart Data Points: {len(data['chart_data'])}")
    else:
        print(f"FAILURE: Failed to fetch shipment analytics. Status: {ship_res.status_code}")
        print(ship_res.text)

    # Verify Driver Analytics
    print("\n4. Testing /analytics/drivers...")
    driver_res = requests.get(f"{BASE_URL}/analytics/drivers", headers=headers)
    if driver_res.status_code == 200:
        data = driver_res.json()
        print(f"SUCCESS: Received data for {len(data)} drivers")
        if len(data) > 0:
            print(f"  Top Driver: {data[0]['name']} ({data[0]['total_shipments']} shipments)")
    else:
        print(f"FAILURE: Failed to fetch driver analytics. Status: {driver_res.status_code}")
        print(driver_res.text)

if __name__ == "__main__":
    verify_analytics()
