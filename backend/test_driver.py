import requests

def test_user(email, password, endpoints):
    print(f"\n--- Testing as {email} ---")
    res = requests.post("http://localhost:8000/token", data={"username": email, "password": password})
    if res.status_code != 200:
        print("Login failed:", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    for ep in endpoints:
        res2 = requests.get(f"http://localhost:8000{ep}", headers=headers)
        print(f"{ep} -> {res2.status_code}")
        if res2.status_code != 200:
            print(res2.text[:500])

test_user("admin@example.com", "password123", ["/shipments", "/users", "/vehicles"])
test_user("msme@example.com", "password123", ["/shipments", "/companies/me", "/companies/others", "/addresses"])
test_user("driver@example.com", "password123", ["/driver/dashboard", "/shipments", "/driver/tripsheet", "/driver/history"])
