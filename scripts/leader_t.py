import pandas as pd
import json
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

def excel_to_json(input_file, output_file):
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
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

# Запуск
excel_to_json('leader_t.xls', 'leader_t_products.json')