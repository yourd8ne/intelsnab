import pandas as pd
import re
import json
from collections import defaultdict

MAIN_CATEGORY = "Инструмент"

def clean_product_name(name, article):
    """Удаляет из названия только то, что совпадает с артикулом."""
    if pd.isna(name):
        return ''
    str_name = str(name) if not isinstance(name, str) else name
    article = str(article).strip() if not pd.isna(article) else ''
    if article and article != 'nan':
        pattern = r'(\s*[\-–—]?\s*' + re.escape(article) + r'\s*[\-–—]?\s*)'
        str_name = re.sub(pattern, ' ', str_name, flags=re.IGNORECASE)
    str_name = re.sub(r'\s+', ' ', str_name).strip()
    str_name = re.sub(r'^[,\s.]+|[,\s.]+$', '', str_name)
    return str_name

def get_first_word(name):
    """Возвращает первое значимое слово из названия"""
    if not name:
        return "Другое"
    words = re.findall(r'\b[\w-]+\b', name)
    for word in words:
        clean = word.strip('.,-').capitalize()
        if len(clean) >= 3 and not clean.isdigit():
            return clean
    return "Другое"

def process_to_json(input_excel_path, output_json_path):
    """Обрабатывает Excel и сохраняет результат в JSON с подкатегориями по первому слову."""
    try:
        df = pd.read_excel(input_excel_path, header=4)

        if df.shape[1] < 2:
            raise ValueError("Файл должен содержать минимум 2 колонки")

        df = df.iloc[:, [1, 2]]
        df.columns = ['article', 'name']

        # Удаляем артикул из названия
        df['name'] = df.apply(lambda row: clean_product_name(row['name'], row['article']), axis=1)
        df = df[(df['name'] != '') & (df['name'].notna())]
        df['article'] = df['article'].astype(str)
        df = df[df['article'] != 'nan']

        # Группируем по подкатегориям (первое слово)
        subcat_map = defaultdict(list)
        for _, row in df.iterrows():
            subcat = get_first_word(row['name'])
            subcat_map[subcat].append({
                'Наименование': row['name'],
                'Артикул': row['article']
            })

        # Формируем структуру для JSON
        result_data = {
            MAIN_CATEGORY: dict(subcat_map)
        }

        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)

        print(f"Успешно обработано {len(df)} записей")
        print(f"Результат сохранен в: {output_json_path}")

    except Exception as e:
        print(f"Ошибка: {str(e)}")

if __name__ == "__main__":
    input_file = "tables/1 (1).xls"
    output_file = "json/1(1).json"

    process_to_json(input_file, output_file)

    with open(output_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        print("\nПример структуры данных:")
        print(json.dumps(data, ensure_ascii=False, indent=2))