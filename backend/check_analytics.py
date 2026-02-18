import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    # Login as admin (assuming admin/admin or similar from seed data)
    # If not sure, we can try to register or use known credentials.
    # checking imports in main.py might reveal seed data
    # models.py shows User model.
    
    # Try default admin credentials often used in dev
    credentials = [
        ("admin@example.com", "admin123"),
        ("admin@logistics.com", "password") # hypothetical
    ]
    
    for email, password in credentials:
        try:
            resp = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
            if resp.status_code == 200:
                print(f"Logged in as {email}")
                return resp.json()["access_token"]
        except Exception as e:
            print(f"Connection failed: {e}")
            sys.exit(1)
            
    print("Failed to login with default credentials")
    sys.exit(1)

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/analytics/fleet",
        "/analytics/shipments",
        "/analytics/drivers"
    ]
    
    for ep in endpoints:
        print(f"Testing {ep}...", end=" ")
        try:
            resp = requests.get(f"{BASE_URL}{ep}", headers=headers)
            if resp.status_code == 200:
                print("OK")
                # print(resp.json())
            else:
                print(f"FAILED ({resp.status_code})")
                print(resp.text)
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    token = get_token()
    test_endpoints(token)
