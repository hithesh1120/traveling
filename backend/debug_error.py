from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Login as admin
res = client.post("/token", data={"username": "admin@example.com", "password": "password123"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

try:
    res2 = client.get("/shipments", headers=headers)
    print(res2.status_code)
    print(res2.text)
except Exception as e:
    import traceback
    traceback.print_exc()

# Login as driver
res3 = client.post("/token", data={"username": "driver@example.com", "password": "password123"})
token3 = res3.json()["access_token"]
headers3 = {"Authorization": f"Bearer {token3}"}

try:
    res4 = client.get("/driver/dashboard", headers=headers3)
    print(res4.status_code)
    print(res4.text)
except Exception as e:
    import traceback
    traceback.print_exc()
