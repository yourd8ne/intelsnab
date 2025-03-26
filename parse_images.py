import pandas as pd
from sqlalchemy import create_engine
from openpyxl import load_workbook
from openpyxl.drawing.image import Image
import os
import psycopg2
from psycopg2 import sql

wb = load_workbook('leader_t.xlsx', data_only=True)
ws = wb.active

output_dir = 'images'
os.makedirs(output_dir, exist_ok=True)

conn = psycopg2.connect(
    dbname='intelsnab',
    user='postgres',
    password='root',
    host='localhost'
)

cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    image_data BYTEA
)
''')

def save_image_to_db(image_path, image_name):
    with open(image_path, 'rb') as image_file:
        binary_data = image_file.read()
        cursor.execute(
            'INSERT INTO product_images (name, image_data) VALUES (%s, %s)',
            (image_name, sql.Binary(binary_data))
        )
        conn.commit()

for image in ws._images:
    image_name = os.path.basename(image.path)
    image_path = os.path.join(output_dir, image_name)

    with open(image_path, 'wb') as img_file:
        img_file.write(image.image.fp.getvalue())

    save_image_to_db(image_path, image_name)


cursor.close()
conn.close()