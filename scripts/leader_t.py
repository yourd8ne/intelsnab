import pandas as pd
import json
import re
from collections import defaultdict

def categorize_product(name):
    """Определяем категорию товара на основе названия"""
    name_lower = name.lower()
    
    categories = {
        'Перчатки': ['перчатк', 'краг', 'рукавиц'],
        'Изолента': ['изолент', 'пвх лент'],
        'Клеи': ['клей', 'клейк'],
        'Пленки': ['пленк', 'стрейч', 'стретч'],
        'Упаковка': ['мешок', 'пакет', 'биг-бэг', 'контейнер'],
        'Средства защиты': ['комбинезон', 'нарукавник', 'фартук', 'защитн'],
        'Технические ткани': ['полотн', 'холст', 'вафельн', 'ветош', 'салфетк', 'протирочн'],
        'Инструменты': ['круг', 'шлифовальн', 'отрезн']
    }
    
    for category, keywords in categories.items():
        if any(keyword in name_lower for keyword in keywords):
            return category
    
    return 'Другое'

def excel_to_json(input_file):
    """Конвертация Excel в JSON"""
    df = pd.read_excel(input_file)
    df = df[['Наименование', 'Описание']].dropna(subset=['Наименование'])
    
    result = defaultdict(list)
    
    for _, row in df.iterrows():
        name = row['Наименование']
        description = row['Описание'] if pd.notna(row['Описание']) else ""
        
        category = categorize_product(name)
        result[category].append({
            'Наименование': name,
            'Описание': description
        })
    
    return result

def remove_article(name):
    """Удаление артикулов из названия"""
    return re.sub(r'\s*\(арт.\d+\)', '', name)

def clean_json(data):
    """Очистка JSON от артикулов"""
    for category, products in data.items():
        for product in products:
            if 'Наименование' in product:
                product['Наименование'] = remove_article(product['Наименование'])
    return data

# Запуск конвертации и очистки
input_excel = 'tables/leader_t.xls'
output_json = 'json/leader_t_products_cleaned.json'

data = excel_to_json(input_excel)  # Конвертация Excel в JSON
cleaned_data = clean_json(data)  # Очистка данных

# Сохранение финального JSON
with open(output_json, 'w', encoding='utf-8') as file:
    json.dump(cleaned_data, file, ensure_ascii=False, indent=2)

print(f"Файл успешно обработан и сохранен: {output_json}")
