import json
import re

with open('fasteners_products.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

def remove_article(name):
    return re.sub(r'\s*ART\s*\d+', '', name)

def process_data(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if key == "Наименование":
                data[key] = remove_article(value)
            else:
                process_data(value)
    elif isinstance(data, list):
        for item in data:
            process_data(item)

process_data(data)

with open('json/fasteners_cleaned.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=2)