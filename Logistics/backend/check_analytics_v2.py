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

async def check_analytics():
    print("--- CHECKING ANALYTICS ENDPOINTS ---")
    
    # 1. Get Token
    async with async_session() as db:
        # Find a Super Admin or Warehouse Ops
        result = await db.execute(select(User).where(User.role == UserRole.SUPER_ADMIN))
        user = result.scalars().first()
        if not user:
            print("No SUPER_ADMIN found. Trying WAREHOUSE_OPS...")
            result = await db.execute(select(User).where(User.role == UserRole.WAREHOUSE_OPS))
            user = result.scalars().first()
            
        if not user:
            print("No suitable user found for analytics test!")
            return
            
        token = create_access_token(data={"sub": user.email, "role": user.role.value})
        print(f"Generated Token for {user.email} ({user.role})")

    # 2. Test Endpoints
    base_url = "http://127.0.0.1:8000"
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/analytics/fleet",
        "/analytics/shipments",
        "/analytics/drivers"
    ]
    
    async with httpx.AsyncClient() as client:
        for ep in endpoints:
            print(f"\nTesting {ep}...", end=" ")
            try:
                response = await client.get(f"{base_url}{ep}", headers=headers)
                if response.status_code == 200:
                    print(f"OK")
                    # print(response.json())
                else:
                    print(f"FAILED ({response.status_code})")
                    print(response.text)
            except Exception as e:
                print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_analytics())
