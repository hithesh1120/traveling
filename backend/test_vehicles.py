
import requests
import sys

API_URL = "http://127.0.0.1:8000"

def test_vehicles():
    # 1. Login
    try:
        resp = requests.post(f"{API_URL}/token", data={
            "username": "admin@example.com",
            "password": "password123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        
        token = resp.json()["access_token"]
        print(f"Got token. Testing /vehicles...")
        
        # 2. Get Vehicles
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{API_URL}/vehicles", headers=headers)
        
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print("Response:", resp.json())
        else:
            print("Error:", resp.text)
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_vehicles()
