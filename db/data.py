import json
import sqlite3

# Пути к файлам
db_path = "db/database.sqlite"
json_path = "merged.json"

# Подключаемся к базе данных
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Функция для вставки данных в таблицу Categories
def insert_category(name, description=None):
    try:
        cursor.execute(
            "INSERT INTO Categories (name, description) VALUES (?, ?)",
            (name, description)
        )
        return cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Ошибка при вставке категории '{name}': {e}")
        return None

# Функция для вставки данных в таблицу Products (без article)
def insert_product(name, price, category_id, description=None, material=None, diameters=None, lengths=None):
    try:
        cursor.execute(
            "INSERT INTO Products (name, price, category_id, description, material, diameters, lengths) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, price, category_id, description, material, diameters, lengths)
        )
    except sqlite3.Error as e:
        print(f"Ошибка при вставке товара '{name}': {e}")

# Функция нормализации JSON (без article)
def normalize_json(data):
    normalized_data = []

    def process_item(item, category=""):
        if isinstance(item, dict):
            if "Наименование" in item or "name" in item:
                normalized_data.append({
                    "category": category,
                    "name": item.get("Наименование", item.get("name")),
                    "description": item.get("Описание", item.get("description", "")),
                    "material": ", ".join(item.get("Материал", [])),
                    "diameters": ", ".join(map(str, item.get("Диаметры", []))) if isinstance(item.get("Диаметры", []), list) else str(item.get("Диаметры", "")),
                    "lengths": ", ".join(map(str, item.get("Длины", []))) if isinstance(item.get("Длины", []), list) else str(item.get("Длины", ""))
                })
            else:
                for key, value in item.items():
                    process_item(value, key)
        elif isinstance(item, list):
            for sub_item in item:
                process_item(sub_item, category)
        elif isinstance(item, str):  # Пропускаем неструктурированные строки
            pass

    process_item(data)
    return normalized_data

# Читаем JSON-файл
try:
    with open(json_path, "r", encoding="utf-8") as file:
        raw_data = json.load(file)
except FileNotFoundError:
    print(f"Файл {json_path} не найден.")
    exit(1)
except json.JSONDecodeError as e:
    print(f"Ошибка при чтении JSON-файла: {e}")
    exit(1)

# Нормализуем данные
normalized_data = normalize_json(raw_data)

# Вставляем нормализованные данные в базу (без article)
for item in normalized_data:
    category_id = insert_category(item["category"]) if item["category"] else None
    insert_product(
        item["name"], price=0.0, category_id=category_id,
        description=item["description"], material=item["material"],
        diameters=item["diameters"], lengths=item["lengths"]
    )

# Сохраняем изменения и закрываем соединение
conn.commit()
conn.close()

print("Данные успешно нормализованы и сохранены в базу данных!")