import sqlite3
import json
import os
import re

DB_PATH = "db/database.sqlite"
JSON_FILES = [
    "json/1(1).json",
    "json/fasteners.json",
    "json/leader_t.json"
]

def get_first_word(name):
    """Возвращает первое значимое слово из названия"""
    if not name:
        return "Другое"
    words = re.findall(r'\b[\w-]+\b', name)
    for word in words:
        clean = word.strip('.,-').capitalize()
        if len(clean) >= 3 and not clean.isdigit():
            return clean
    return "Другое"

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

def save_products(cursor, main_category, subcat_name, products):
    # "Расплющиваем" вложенные списки, если они есть
    flat_products = []
    for item in products:
        if isinstance(item, dict):
            flat_products.append(item)
        elif isinstance(item, list):
            flat_products.extend([x for x in item if isinstance(x, dict)])
    products = flat_products

    main_id = ensure_category(cursor, main_category, None, f"Категория {main_category}")
    subcat_id = ensure_category(cursor, subcat_name, main_id, f"Подкатегория {subcat_name}")
    for prod in products:
        cursor.execute(
            """INSERT INTO Products (name, article, description, material, diameters, lengths, category_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                prod.get("Наименование") or prod.get("name") or "",
                prod.get("Артикул") or prod.get("article") or "",
                prod.get("Описание") or prod.get("description") or "",
                ", ".join(prod.get("Материал", [])) if isinstance(prod.get("Материал", []), list) else prod.get("Материал", ""),
                ", ".join(map(str, prod.get("Диаметры", []))) if isinstance(prod.get("Диаметры", []), list) else prod.get("Диаметры", ""),
                ", ".join(map(str, prod.get("Длины", []))) if isinstance(prod.get("Длины", []), list) else prod.get("Длины", ""),
                subcat_id
            )
        )

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Products")
    cursor.execute("DELETE FROM Categories")

    for json_path in JSON_FILES:
        if not os.path.exists(json_path):
            print(f"Файл не найден: {json_path}")
            continue
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for main_category, content in data.items():
            if isinstance(content, dict):
                for subcat, products in content.items():
                    if isinstance(products, list):
                        save_products(cursor, main_category, subcat, products)
                    elif isinstance(products, dict):
                        all_products = []
                        for v in products.values():
                            if isinstance(v, list):
                                all_products.extend(v)
                            elif isinstance(v, dict):
                                all_products.append(v)
                        save_products(cursor, main_category, subcat, all_products)
            elif isinstance(content, list):
                save_products(cursor, main_category, main_category, content)

    conn.commit()
    conn.close()
    print("Импорт завершён!")

if __name__ == "__main__":
    main()