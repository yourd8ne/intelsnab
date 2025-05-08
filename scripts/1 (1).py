import pandas as pd
import re
import json
from collections import defaultdict

EXCLUDED_CATEGORIES = {
    "415550", "815010", "815015", "815020", "815107", "815110", "815115", "815716",
    "904122", "904124", "904128", "904334", "904336", "904433", "904435", "976220",
    "А-0,1", "А-0,1кг", "А-0,2", "А-0,2кг", "А-0,4", "А-0,4кг", "А-0,5", "А-0,5кг",
    "А-0,6", "А-0,6кг", "А-0,8", "А-0,8кг", "А-1,0", "А-1кг", "Кгд", "Кгд10",
    "Кгд12", "Кгж", "Кгк", "Кгк10", "Кгк11", "Кгк12", "Кгк12а", "Кгк16", "Кгк21",
    "Кгкм", "Кгкп", "Кгкс", "Кгку", "Кгн", "Кгно", "Кго", "Кгоу", "Кгш", "НИ-289"
}

def clean_product_name(name):
    """Удаляет артикулы и лишние цифры из названия товара."""
    if pd.isna(name):
        return ''

    str_name = str(name) if not isinstance(name, str) else name

    # Удаляем артикулы типа "БМ 960600" в начале или конце
    cleaned_name = re.sub(r'^(БМ|BM)\s*\d+\s*|\s*(БМ|BM)\s*\d+\s*$', '', str_name, flags=re.IGNORECASE)

    # Удаляем 5-6 цифр в конце названия (10900) если они идут после пробела
    cleaned_name = re.sub(r'\s\d{5,6}\s*$', '', cleaned_name)

    # Удаляем "nan" если он вдруг появился
    cleaned_name = cleaned_name.replace('nan', '').strip()

    return cleaned_name

def get_category(name):
    """Определяет категорию товара, избегая чисел и коротких кодов."""
    words = name.split()

    if not words:
        return "Другое"

    first_word = words[0]

    # Если первое слово — число, берем **второе** слово, если оно есть
    if first_word.isdigit() and len(words) > 1:
        first_word = words[1]

    # Если категория в списке исключенных — пропускаем
    if first_word in EXCLUDED_CATEGORIES:
        return "Другое"

    # Если слово слишком короткое (< 3 символов) — пропускаем
    if len(first_word) < 3:
        return "Другое"

    return first_word.capitalize()

def process_to_json(input_excel_path, output_json_path):
    """Обрабатывает Excel и сохраняет результат в JSON с фильтрацией категорий."""
    try:
        df = pd.read_excel(input_excel_path, header=4)

        # Выбираем нужные колонки (артикул и название)
        if df.shape[1] < 2:
            raise ValueError("Файл должен содержать минимум 2 колонки")

        df = df.iloc[:, [1, 2]]  # Колонки B и C (артикул и название)
        df.columns = ['article', 'name']

        # Очистка данных
        df['name'] = df['name'].apply(clean_product_name)
        df = df[(df['name'] != '') & (df['name'].notna())]
        df['article'] = df['article'].astype(str)
        df = df[df['article'] != 'nan']

        # Группировка товаров по категории, исключая ненужные значения
        categorized_data = defaultdict(list)

        for _, row in df.iterrows():
            category = get_category(row['name'])
            if category != "Другое":  # Исключаем ненужные категории
                categorized_data[category].append({
                    'Наименование': row['name']
                })

        # Сохранение в JSON
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(categorized_data, f, ensure_ascii=False, indent=2)

        print(f"Успешно обработано {len(df)} записей")
        print(f"Результат сохранен в: {output_json_path}")

    except Exception as e:
        print(f"Ошибка: {str(e)}")

# Использование
if __name__ == "__main__":
    input_file = "tables/1 (1).xls"
    output_file = "json/products_1(1)_filtered.json"

    process_to_json(input_file, output_file)

    with open(output_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        print("\nПример структуры данных:")
        print(json.dumps(data, ensure_ascii=False, indent=2))
