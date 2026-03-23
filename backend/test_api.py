import requests

# 1. Login
url = "http://localhost:8000/token"
data = {"username": "admin@logisoft.com", "password": "adminpassword"}
res = requests.post(url, data=data)
print("Login status:", res.status_code)
if res.status_code != 200:
    print(res.text)
    exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Shipments
res2 = requests.get("http://localhost:8000/shipments", headers=headers)
print("Shipments status:", res2.status_code)
print(res2.text[:1000])

# 3. Get Vehicles
res3 = requests.get("http://localhost:8000/vehicles", headers=headers)
print("Vehicles status:", res3.status_code)
print(res3.text[:1000])

# 4. Get Tracking data (users)
res4 = requests.get("http://localhost:8000/users?role=DRIVER", headers=headers)
print("Users status:", res4.status_code)
print(res4.text[:1000])
