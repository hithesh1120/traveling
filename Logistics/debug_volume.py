import requests

def debug_volume():
    # 1. Login
    login_url = "http://localhost:8000/token"
    # Assuming the seeded admin or msme user exists. 
    # Try the seeded admin from reproduction script if known, or creates new one.
    # Actually, main.py doesn't automatically seed users, but `create_admin_script.py` did.
    # I'll try to signup a new user to be sure.
    
    email = "debug_vol1@test.com"
    password = "password123"
    
    signup_url = "http://localhost:8000/signup/msme"
    payload = {
        "user_details": {"email": email, "password": password, "role": "MSME"},
        "company_details": {"name": "TestCo", "gst_number": "GST123", "address": "Addr"}
    }
    
    try:
        requests.post(signup_url, json=payload)
    except:
        pass # Maybe already exists
        
    # Login
    resp = requests.post(login_url, data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Order
    # 100x100x100 cm = 1,000,000 cm3 = 1 m3
    order_payload = {
        "item_name": "Test Volume Item",
        "length_cm": 100,
        "width_cm": 100,
        "height_cm": 100,
        "weight_kg": 10,
        "latitude": 12.9716, 
        "longitude": 77.5946
    }
    
    o_resp = requests.post("http://localhost:8000/orders", json=order_payload, headers=headers)
    print("Create Order Response:")
    print(o_resp.text)
    
    if o_resp.status_code == 200:
        data = o_resp.json()
        print(f"Calculated Volume: {data.get('volume_m3')}")

if __name__ == "__main__":
    debug_volume()
