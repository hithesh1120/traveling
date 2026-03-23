from fastapi.testclient import TestClient
from main import app
import builtins
with open("test_results.txt", "w") as f:
    def custom_print(*args):
        f.write(" ".join(str(a) for a in args) + "\n")
    builtins.print = custom_print

    client = TestClient(app)

    # Admin
    res = client.post("/token", data={"username": "admin@example.com", "password": "password123"})
    if res.status_code == 200:
        headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
        r = client.get("/shipments", headers=headers)
        print("ADMIN /shipments", r.status_code, dict(r.headers))
    # MSME
    res = client.post("/token", data={"username": "msme@example.com", "password": "password123"})
    if res.status_code == 200:
        headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
        r = client.get("/shipments", headers=headers)
        print("MSME /shipments", r.status_code, dict(r.headers))
    # Driver
    res = client.post("/token", data={"username": "driver@example.com", "password": "password123"})
    if res.status_code == 200:
        headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
        r = client.get("/driver/dashboard", headers=headers)
        print("DRIVER /dashboard", r.status_code, dict(r.headers))
