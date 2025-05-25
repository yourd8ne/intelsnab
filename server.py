from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всего приложения

def get_catalog():
    conn = sqlite3.connect("db/database.sqlite")
    cursor = conn.cursor()

    # Получаем все категории с parent_id
    cursor.execute("SELECT id, name, parent_id FROM Categories")
    categories = {row[0]: {"name": row[1], "parent_id": row[2]} for row in cursor.fetchall()}

    # Получаем все товары
    cursor.execute("SELECT name, article, description, material, diameters, lengths, category_id FROM Products")
    products = cursor.fetchall()
    conn.close()

    # Строим структуру: {main_category: {sub_category: [products]}}
    catalog = {}
    for product in products:
        name, article, description, material, diameters, lengths, category_id = product
        cat = categories.get(category_id)
        if not cat:
            continue
        # sub_category
        subcat_name = cat["name"]
        # main_category
        parent_id = cat["parent_id"]
        maincat_name = categories[parent_id]["name"] if parent_id and parent_id in categories else subcat_name

        if maincat_name not in catalog:
            catalog[maincat_name] = {}
        if subcat_name not in catalog[maincat_name]:
            catalog[maincat_name][subcat_name] = []
        catalog[maincat_name][subcat_name].append({
            "name": name,
            # "article": article,
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