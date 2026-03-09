import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import User

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "admin@example.com"))
        user = res.scalars().first()
        if user:
            print(f"Admin: ID={user.id}, Role={user.role}, CompanyID={user.company_id}")
        else:
            print("Admin not found")

if __name__ == "__main__":
    asyncio.run(check())
