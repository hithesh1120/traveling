
import sqlite3
import os

DB_PATH = "C:/Users/hithe/OneDrive/Desktop/internship/Logistics_new/backend/logistics.db"


def inspect_db():
    if not os.path.exists(DB_PATH):
        with open("db_dump.txt", "w", encoding="utf-8") as f:
            f.write(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    with open("db_dump.txt", "w", encoding="utf-8") as f:
        f.write("--- Vehicles ---\n")
        try:
            cursor.execute("SELECT * FROM vehicles")
            # Get column names
            names = list(map(lambda x: x[0], cursor.description))
            f.write(f"Columns: {names}\n")
            rows = cursor.fetchall()
            for row in rows:
                f.write(str(row) + "\n")
        except Exception as e:
            f.write(f"Error reading vehicles: {e}\n")

        f.write("\n--- All Users ---\n")
        try:
            cursor.execute("SELECT * FROM users")
            names = list(map(lambda x: x[0], cursor.description))
            f.write(f"Columns: {names}\n")
            rows = cursor.fetchall()
            for row in rows:
                f.write(str(row) + "\n")
        except Exception as e:
            f.write(f"Error reading users: {e}\n")

    conn.close()

if __name__ == "__main__":
    inspect_db()

