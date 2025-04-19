import re
import json

with open('json/leader_t_products.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

def remove_article(name):
    return re.sub(r'\s*\(арт.\d+\)', '', name)

for category, products in data.items():
    for product in products:
        if 'Наименование' in product:
            product['Наименование'] = remove_article(product['Наименование'])

with open('json/leader_t_products_cleaned.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=2)