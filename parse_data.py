import pandas as pd
from sqlalchemy import create_engine

db_user = 'postgres'
db_password = 'root'
db_host = 'localhost'
db_port = '5432'
db_name = 'intelsnab'

connection_string = f'postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'

engine = create_engine(connection_string)

csv_file = 'leader_t.csv'
df = pd.read_csv(csv_file, encoding='utf-8')

df['Описание'] = df['Описание'].str.replace('\n', ' ', regex=False)

df['Цена'] = df['Цена'].str.replace(',', '.').astype(float)

df['Остаток'] = df['Остаток'].astype(int)

df.rename(columns={
    'Наименование': 'name',
    'Описание': 'description',
    'Цена': 'price',
    'Упаковка': 'package',
    'Остаток': 'stock_quantity',
    'Изображение': 'image_url'
}, inplace=True)

table_name = 'products'

try:
    df.to_sql(table_name, engine, if_exists='replace', index=False)
    print(f"Данные успешно импортированы в таблицу {table_name}.")
except Exception as e:
    print(f"Произошла ошибка при импорте данных: {e}")