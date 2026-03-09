import urllib.request
import urllib.parse
import json

def main():
    base_url = "http://localhost:8000"
    login_data = urllib.parse.urlencode({"username": "admin@example.com", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/token", data=login_data)
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode("utf-8"))["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(f"{base_url}/notifications", headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            print("Notif Status code:", resp.getcode())
            print("Notif Response:", json.loads(resp.read().decode("utf-8")))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
