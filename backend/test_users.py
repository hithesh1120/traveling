import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import User

async def list_users():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        with open("users_utf8.txt", "w", encoding="utf-8") as f:
            for u in users:
                f.write(f"User: ID={u.id}, Email={u.email}, Role={u.role}, CompanyID={u.company_id}\n")

if __name__ == "__main__":
    asyncio.run(list_users())
