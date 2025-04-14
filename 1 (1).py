import pandas as pd
import re
import json

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

def process_to_json(input_excel_path, output_json_path):
    """Обрабатывает Excel и сохраняет результат в JSON"""
    try:
        # Чтение Excel (пропускаем 4 строки заголовка)
        df = pd.read_excel(input_excel_path, header=4)
        
        # Выбираем нужные колонки (B и C) - артикул и название
        if df.shape[1] < 2:
            raise ValueError("Файл должен содержать минимум 2 колонки")
            
        df = df.iloc[:, [1, 2]]  # Колонки B и C (артикул и название)
        df.columns = ['article', 'name']
        
        # Очистка данных
        df['name'] = df['name'].apply(clean_product_name)
        df = df[(df['name'] != '') & (df['name'].notna())]
        df['article'] = df['article'].astype(str)
        df = df[df['article'] != 'nan']  # Удаляем строки с пустыми артикулами
        
        # Конвертация в JSON-совместимый формат
        result = df.to_dict(orient='records')
        
        # Сохранение в JSON
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        print(f"Успешно обработано {len(result)} записей")
        print(f"Результат сохранен в: {output_json_path}")
        
        return True
    
    except Exception as e:
        print(f"Ошибка: {str(e)}")
        return False

# Использование
if __name__ == "__main__":
    input_file = "1 (1).xls"  # Ваш исходный файл
    output_file = "products_1(1).json"  # Выходной JSON-файл
    
    if process_to_json(input_file, output_file):
        # Показать пример содержимого
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print("\nПример первых 5 записей:")
            print(json.dumps(data[:5], ensure_ascii=False, indent=2))
    else:
        print("Обработка завершена с ошибками")