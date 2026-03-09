import asyncio
import sys
import os

sys.path.append(os.getcwd())

from database import AsyncSessionLocal
from sqlalchemy import select
from models import User, Notification

async def seed_notif():
    async with AsyncSessionLocal() as db:
        admin_res = await db.execute(select(User).where(User.email == "admin@example.com"))
        admin = admin_res.scalars().first()
        if admin:
            notif = Notification(user_id=admin.id, type="ALERT", title="Test Notification", message="This is a test to see if notifications work.")
            db.add(notif)
            await db.commit()
            print("Seeded test notification for admin")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_notif())
