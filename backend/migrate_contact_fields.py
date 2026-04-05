import sqlite3

def run():
    conn = sqlite3.connect('logistics.db')
    cursor = conn.cursor()

    # Add columns if they don't exist
    try:
        cursor.execute("ALTER TABLE saved_addresses ADD COLUMN contact VARCHAR;")
    except sqlite3.OperationalError:
        pass # Column might exist

    try:
        cursor.execute("ALTER TABLE saved_addresses ADD COLUMN phone VARCHAR;")
    except sqlite3.OperationalError:
        pass

    # Remove the text ' (Edited)' from any existing label
    cursor.execute("UPDATE saved_addresses SET label = REPLACE(label, ' (Edited)', '');")

    conn.commit()
    conn.close()
    print("Migration successful")

if __name__ == '__main__':
    run()
