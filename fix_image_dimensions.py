import psycopg2
import requests
from io import BytesIO
from PIL import Image

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="railway",
    user="postgres",
    password="KphrxAvhNlegECWJqGoaNvqAOjVfbjkl",
    host="roundhouse.proxy.rlwy.net",
    port="30657",
    sslmode='require'  # Add SSL mode since DB_SSL=true
)
cursor = conn.cursor()

# Get all images (no filter, to recheck all)
cursor.execute("SELECT id, image_url FROM images")
images = cursor.fetchall()

for img_id, img_url in images:
    try:
        # Fetch image from URL
        response = requests.get(img_url, timeout=10)  # Timeout to prevent long waits
        response.raise_for_status()  # Raise exception if request fails
        image = Image.open(BytesIO(response.content))

        # Extract width and height
        width, height = image.size

        # Update the database (force update even if width/height exist)
        cursor.execute(
            "UPDATE images SET width = %s, height = %s WHERE id = %s",
            (width, height, img_id)
        )
        print(f"✅ Updated image {img_id} - Width: {width}, Height: {height}")

    except requests.exceptions.RequestException as req_err:
        print(f"❌ Failed to fetch image {img_id} ({img_url}): {req_err}")
    except Exception as e:
        print(f"❌ Failed to process image {img_id}: {e}")

# Commit and close connection
conn.commit()
cursor.close()
conn.close()
print("✅ Database update complete!")
