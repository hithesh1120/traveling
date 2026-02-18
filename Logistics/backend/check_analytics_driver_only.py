import asyncio
import httpx
from sqlalchemy import select
from database import AsyncSessionLocal as async_session
from models import User, UserRole
from auth import create_access_token
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check_driver():
    print("--- CHECKING DRIVER ANALYTICS ---")
    async with async_session() as db:
        result = await db.execute(select(User).where(User.role == UserRole.SUPER_ADMIN))
        user = result.scalars().first()
        if not user:
            print("No SUPER_ADMIN found.")
            return
        token = create_access_token(data={"sub": user.email, "role": user.role.value})
        print(f"Token generated for {user.email}")

    url = "http://127.0.0.1:8000/analytics/drivers"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_driver())
