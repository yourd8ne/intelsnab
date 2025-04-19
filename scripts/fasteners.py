import pandas as pd
import psycopg2
from psycopg2 import sql

def parse_excel_to_db(excel_path):
    # Подключение к БД
    conn = psycopg2.connect(
        dbname='intelsnab',
        user='postgres',
        password='root',
        host='localhost'
    )
    cur = conn.cursor()
    
    # Сначала создадим уникальный индекс для name в categories
    try:
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS categories_name_idx ON categories (name)")
        conn.commit()
    except Exception as e:
        print(f"Ошибка при создании индекса: {e}")
        conn.rollback()
    
    # Чтение Excel
    excel_data = pd.ExcelFile(excel_path)
    
    # Обработка каждого листа
    for sheet_name in excel_data.sheet_names:
        # Определяем категорию (первое слово в названии листа)
        category_name = sheet_name.split()[0]
        print(f"Обрабатываю лист: {sheet_name}, категория: {category_name}")
        
        try:
            # Добавляем категорию в БД (теперь с правильным ON CONFLICT)
            cur.execute(
                """INSERT INTO categories (name) 
                   VALUES (%s) 
                   ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name 
                   RETURNING id""",
                (category_name,)
            )
            category_id = cur.fetchone()[0]
            
            # Читаем данные листа
            df = excel_data.parse(sheet_name)
            
            # Парсим товары
            for _, row in df.iterrows():
                if pd.notna(row.get('Наименование')):
                    product_name = row['Наименование']
                    print(f"Добавляю товар: {product_name}")
                    
                    # Формируем описание
                    description = ""
                    if pd.notna(row.get('Материал')):
                        description += f"Материал: {row['Материал']}\n"
                    if pd.notna(row.get('Стандарт')):
                        description += f"Стандарт: {row['Стандарт']}\n"
                    
                    # Вставляем товар
                    cur.execute(
                        """INSERT INTO products (category_id, name, description) 
                           VALUES (%s, %s, %s)""",
                        (category_id, product_name, description)
                    )
            
            conn.commit()
            
        except Exception as e:
            print(f"Ошибка при обработке листа {sheet_name}: {e}")
            conn.rollback()
    
    cur.close()
    conn.close()

# Использование
parse_excel_to_db('товары.xlsx')