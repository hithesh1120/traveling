import sqlite3
import os
from datetime import datetime

db_path = os.path.join(os.path.dirname(__file__), 'logistics.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Create a new company for Hithesh
c.execute("""
    INSERT INTO companies (name, description, address, created_at)
    VALUES ('Hith Logistics Co.', 'Company for Hithesh admin', 'Hyderabad', ?)
""", (datetime.utcnow().isoformat(),))
new_company_id = c.lastrowid
print(f"Created new company id={new_company_id}")

# 2. Move hith and prem to the new company
c.execute("UPDATE users SET company_id=? WHERE email='hith@gmail.com'", (new_company_id,))
c.execute("UPDATE users SET company_id=? WHERE email='prem@gmail.com'", (new_company_id,))
conn.commit()

# 3. Verify
print("\n=== Final state ===")
c.execute("SELECT id, email, role, company_id FROM users ORDER BY id")
for row in c.fetchall():
    print(row)

print("\n=== Companies ===")
c.execute("SELECT id, name FROM companies")
for row in c.fetchall():
    print(row)

conn.close()
