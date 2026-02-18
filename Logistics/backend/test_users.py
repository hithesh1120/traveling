import asyncio
import httpx
from sqlalchemy import select
from database import AsyncSessionLocal as async_session, engine
from models import User, UserRole
from auth import create_access_token
import sys

# Windows policy fix for asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_users_endpoint():
    print("--- TESTING USERS ENDPOINT ---")
    
    # 1. Create a fresh admin token
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        admin = result.scalars().first()
        if not admin:
            print("Admin user not found in DB!")
            return
        
        token = create_access_token(data={"sub": admin.email})
        print(f"Generated Admin Token for {admin.email}")

    # 2. Test the endpoint using httpx
    # Note: We must hit the running server URL
    url = "http://127.0.0.1:8000/users"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Requesting {url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            print(f"Response Status: {response.status_code}")
            if response.status_code == 200:
                users = response.json()
                print(f"Success! Loaded {len(users)} users.")
                for u in users:
                    print(f" - {u['name']} ({u['role']})")
            else:
                print(f"Failed: {response.text}")
                
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_users_endpoint())
