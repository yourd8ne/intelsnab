import pandas as pd
import json
import re
from collections import defaultdict

MAIN_CATEGORY = "Режущий, слесарный, измерительный инструмент"

def categorize_product(name):
    """Определяем подкатегорию товара на основе названия"""
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

def remove_article(name):
    """Удаление артикулов из названия"""
    return re.sub(r'\s*\(арт.\d+\)', '', name)

def excel_to_json(input_file, output_file):
    df = pd.read_excel(input_file)
    df = df[['Наименование', 'Описание']].dropna(subset=['Наименование'])
    result = defaultdict(list)
    for _, row in df.iterrows():
        name = row['Наименование']
        description = row['Описание'] if pd.notna(row['Описание']) else ""
        category = categorize_product(name)
        name = remove_article(name)
        result[category].append({
            'Наименование': name,
            'Описание': description
        })
    # Вложить в основную категорию
    final = {MAIN_CATEGORY: dict(result)}
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(final, file, ensure_ascii=False, indent=2)
    print(f"Файл успешно обработан и сохранен: {output_file}")

if __name__ == "__main__":
    input_excel = 'tables/leader_t.xls'
    output_json = 'json/leader_t_products_cleaned.json'
    excel_to_json(input_excel, output_json)
