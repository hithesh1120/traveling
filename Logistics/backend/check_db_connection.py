import asyncio
import asyncpg

async def check_connection(password):
    try:
        conn = await asyncpg.connect(user='postgres', password=password, database='postgres', host='localhost')
        await conn.close()
        print(f"SUCCESS: {password}")
        return True
    except Exception as e:
        print(f"FAILED: {password} - {e}")
        return False

async def main():
    passwords = ['password', 'postgres', 'admin', '123456', 'root', '']
    for pwd in passwords:
        if await check_connection(pwd):
            break

if __name__ == "__main__":
    asyncio.run(main())
