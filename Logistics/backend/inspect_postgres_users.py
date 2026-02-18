import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal as async_session
from models import User, UserRole

async def inspect_users():
    print("--- INSPECTING USERS (VIA SQLALCHEMY) ---")
    async with async_session() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role} (Type: {type(u.role)}), VendorID: {u.vendor_id}, Active: {u.is_active}")
            # Check if role is valid enum
            try:
                # If u.role is already an Enum object, this is fine.
                # If it's a string, we check if it's in UserRole
                if isinstance(u.role, UserRole):
                    print(f"  -> Valid Enum: {u.role.value}")
                else:
                    print(f"  -> Raw Value: {u.role}")
            except Exception as e:
                print(f"  -> Validation Error: {e}")

if __name__ == "__main__":
    # Fix for Windows asyncio
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(inspect_users())
