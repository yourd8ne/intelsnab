import sqlite3
import json
import os

DB_PATH = "db/database.sqlite"
JSON_FILES = [
    "json/hand_tools.json",
    "json/fasteners.json",
    "json/leader_t.json"
]

def ensure_category(cursor, name, parent_id=None, description=None):
    cursor.execute(
        "SELECT id FROM Categories WHERE name=? AND parent_id IS ?",
        (name, parent_id)
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        "INSERT INTO Categories (name, parent_id, description) VALUES (?, ?, ?)",
        (name, parent_id, description)
    )
    return cursor.lastrowid

def save_products(cursor, category_id, products):
    for product in products:
        if not isinstance(product, dict):
            continue
        # Универсальная обработка полей
        name = product.get("Наименование") or product.get("Название") or product.get("name") or ""
        article = product.get("Артикул", "")
        description = product.get("Описание", "")
        material = product.get("Материал", "")
        diameters = product.get("Диаметры", "")
        lengths = product.get("Длины", "")

        # Преобразуем массивы в строки
        if isinstance(material, list):
            material = ", ".join(map(str, material))
        if isinstance(diameters, list):
            diameters = ", ".join(map(str, diameters))
        if isinstance(lengths, list):
            lengths = ", ".join(map(str, lengths))

        cursor.execute(
            """INSERT INTO Products (name, article, description, material, diameters, lengths, category_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (name, article, description, material, diameters, lengths, category_id)
        )

def process_json(cursor, data, parent_id=None):
    for category_name, content in data.items():
        category_id = ensure_category(cursor, category_name, parent_id)
        if isinstance(content, dict):
            for subcat_name, products in content.items():
                subcat_id = ensure_category(cursor, subcat_name, category_id)
                if isinstance(products, list):
                    save_products(cursor, subcat_id, products)
        elif isinstance(content, list):
            save_products(cursor, category_id, content)

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("DELETE FROM Products")
    cursor.execute("DELETE FROM Categories")

    for json_file in JSON_FILES:
        if not os.path.exists(json_file):
            print(f"Файл не найден: {json_file}")
            continue
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        process_json(cursor, data)

    conn.commit()
    conn.close()
    print("Импорт завершён!")

if __name__ == "__main__":
    main()