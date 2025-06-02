from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

JSON_FILES = [
    "json/products.json",
    "json/fasteners.json"
    #"json/leader_t.json"
]

def load_full_catalog():
    catalog = {}
    for path in JSON_FILES:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # data — это словарь с одной основной категорией
                catalog.update(data)
    return catalog

@app.route("/api/catalog", methods=["GET"])
def api_catalog():
    catalog = load_full_catalog()
    return jsonify(catalog)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
