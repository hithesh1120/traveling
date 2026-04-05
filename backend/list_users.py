import asyncio
import os
from sqlalchemy import select, update
from database import AsyncSessionLocal
from models import User, UserRole

async def fix_users():
    async with AsyncSessionLocal() as db:
        # Fix hith@gmail.com: set is_active=True
        await db.execute(
            update(User).where(User.email == "hith@gmail.com").values(is_active=True)
        )
        # Fix prem@gmail.com: set is_active=True and role=MSME
        await db.execute(
            update(User).where(User.email == "prem@gmail.com").values(is_active=True, role=UserRole.MSME)
        )
        await db.commit()

        # Verify
        res = await db.execute(select(User))
        for u in res.scalars().all():
            print(f"ID={u.id} | {u.email} | {u.role} | is_active={u.is_active}")

if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_users())
