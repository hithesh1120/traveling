
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    return response

def get_admin_token():
    res = login("admin@example.com", "password123")
    if res.status_code != 200:
        print("Failed to login as admin")
        sys.exit(1)
    return res.json()["access_token"]

def verify_login_block():
    print("1. Setup: Creating/Getting Test User")
    admin_token = get_admin_token()
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create or get test user
    test_email = "inactive_test@example.com"
    test_pass = "password123"
    
    users_res = requests.get(f"{BASE_URL}/users", headers=headers)
    users = users_res.json()
    test_user = next((u for u in users if u['email'] == test_email), None)
    
    if not test_user:
        create_res = requests.post(f"{BASE_URL}/admin/users", json={
            "email": test_email,
            "password": test_pass,
            "name": "Inactive Test User",
            "role": "DRIVER",
            "phone": "9999999999",
            "license_number": "TEST-DL-INACTIVE"
        }, headers=headers)
        if create_res.status_code != 200:
            print(f"Failed to create test user: {create_res.text}")
            sys.exit(1)
        test_user = create_res.json()

    print(f"Test User ID: {test_user['id']}")

    # 2. Deactivate User
    print("2. Deactivating Test User...")
    status_res = requests.put(f"{BASE_URL}/admin/users/{test_user['id']}/status?is_active=false", headers=headers)
    if status_res.status_code != 200:
        print(f"Failed to deactivate user: {status_res.text}")
        sys.exit(1)
        
    # 3. Attempt Login (Should Fail)
    print("3. Attempting Login as Inactive User...")
    login_res = login(test_email, test_pass)
    
    if login_res.status_code == 400 and "contact your administrator" in login_res.text.lower():
        print("SUCCESS: Login blocked with 400 and custom 'contact admin' message.")
    elif login_res.status_code == 401:
         # Some implementations might use 401, but we set 400
         print(f"Login failed with 401. Response: {login_res.text}")
         if "inactive" in login_res.text.lower():
             print("SUCCESS: Login blocked (401)")
         else:
             print("WARNING: Login failed but maybe not due to inactivity?")
    else:
        print(f"FAILURE: Unexpected status code {login_res.status_code}")
        print(login_res.text)
        sys.exit(1)

    # 4. Reactivate User
    print("4. Reactivating User...")
    requests.put(f"{BASE_URL}/admin/users/{test_user['id']}/status?is_active=true", headers=headers)
    
    # 5. Attempt Login (Should Succeed)
    print("5. Attempting Login as Active User...")
    login_res_2 = login(test_email, test_pass)
    if login_res_2.status_code == 200:
        print("SUCCESS: Login succeeded after reactivation.")
    else:
        print(f"FAILURE: Login failed after reactivation. {login_res_2.text}")
        sys.exit(1)

if __name__ == "__main__":
    verify_login_block()
