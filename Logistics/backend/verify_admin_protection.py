
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {email}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def verify_protection():
    # Login as Super Admin
    print("Logging in as Super Admin...")
    # Assuming standard admin credentials from seed_data
    try:
        token = login("admin@example.com", "password123") 
    except:
        print("Could not login as admin@example.com.")
        # Fallback to creating one if needed, but let's try to list users first if we can't login? 
        # Actually, we need a token to list users. 
        # Let's assume the previous verification flow used a working admin.
        # Re-using the logic from verify_logistics_flow.py which usually creates/uses an admin.
        # For simplicity, I'll assume admin@example.com exists as per seed data.
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get current user (me) to get ID
    me_res = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if me_res.status_code != 200:
        print("Failed to get current user")
        sys.exit(1)
    me = me_res.json()
    print(f"Current User: {me['email']} (ID: {me['id']}, Role: {me['role']})")

    if me['email'] != 'admin@example.com':
        print("Test user is not admin@example.com. Aborting test.")
        sys.exit(1)

    # 2. Attempt to deactivate self (Root Admin)
    print(f"Attempting to deactivate Root Admin ({me['email']})...")
    status_res = requests.put(f"{BASE_URL}/admin/users/{me['id']}/status?is_active=false", headers=headers)
    
    if status_res.status_code == 403:
        print("SUCCESS: blocked deactivation of Root Admin (403 Forbidden)")
    else:
        print(f"FAILURE: Expected 403, got {status_res.status_code}")
        print(status_res.text)

    # 3. Create a secondary Admin and attempt to deactivate (Should Succeed)
    print("Creating secondary Super Admin...")
    admin2_email = "fleet@example.com"
    # Check if exists
    users_res = requests.get(f"{BASE_URL}/users", headers=headers)
    users = users_res.json()
    target_admin = next((u for u in users if u['email'] == admin2_email), None)
    
    if not target_admin:
        # Create one if not exists (though verify_logistics_flow usually creates it or we use existing)
        # If we can't create via API because we removed Fleet Manager code... 
        # But wait, we removed Fleet Manager ROLE, not the ability to have other admins.
        # Let's try creating a USER with SUPER_ADMIN role.
        create_res = requests.post(f"{BASE_URL}/admin/users", json={
            "email": admin2_email, "password": "password123", "name": "Fleet Manager", "role": "SUPER_ADMIN"
        }, headers=headers)
        if create_res.status_code == 200:
            target_admin = create_res.json()
        else:
            print(f"Failed to create secondary admin: {create_res.text}")

    if target_admin:
        print(f"Attempting to deactivate secondary Admin {target_admin['email']}...")
        status_res = requests.put(f"{BASE_URL}/admin/users/{target_admin['id']}/status?is_active=false", headers=headers)
        
        if status_res.status_code == 200:
            print("SUCCESS: Deactivated secondary Admin (Hierarchy respected)")
            # Reactivate
            requests.put(f"{BASE_URL}/admin/users/{target_admin['id']}/status?is_active=true", headers=headers)
        else:
            print(f"FAILURE: Failed to deactivate secondary Admin. Status: {status_res.status_code}")
            print(status_res.text)
    else:
        print("No suitable secondary admin found for test.")

if __name__ == "__main__":
    verify_protection()
