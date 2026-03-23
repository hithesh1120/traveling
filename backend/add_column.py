import sqlite3
conn = sqlite3.connect("logistics.db")
c = conn.cursor()
try:
    c.execute("ALTER TABLE shipments ADD COLUMN remarks VARCHAR")
    conn.commit()
    print("Column remarks added successfully.")
except Exception as e:
    print("Error:", e)
conn.close()
