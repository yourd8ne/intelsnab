from flask import Flask, jsonify
from flask_cors import CORS  # Импортируем CORS
import sqlite3
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всего приложения

# Функция для получения каталога
def get_catalog():
    conn = sqlite3.connect("db/database.sqlite")
    cursor = conn.cursor()

    cursor.execute("SELECT name, description, material, diameters, lengths, category_id FROM Products")
    products = cursor.fetchall()

    cursor.execute("SELECT id, name FROM Categories")
    categories = {row[0]: row[1] for row in cursor.fetchall()}

    conn.close()

    catalog = defaultdict(list)
    
    for product in products:
        name, description, material, diameters, lengths, category_id = product
        category_name = categories.get(category_id, "Без категории")
        
        catalog[category_name].append({
            "name": name,
            "description": description,
            "material": material,
            "diameters": diameters,
            "lengths": lengths
        })

    return catalog

@app.route("/api/catalog")
def api_catalog():
    return jsonify(get_catalog())

if __name__ == "__main__":
    app.run(debug=True)