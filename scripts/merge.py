import os
import json

# Путь к папке с JSON-файлами
folder_path = "json"
output_file = "merged.json"

# Список для хранения данных из всех JSON-файлов
merged_data = []

# Проходим по всем файлам в папке
for filename in os.listdir(folder_path):
    if filename.endswith(".json"):
        file_path = os.path.join(folder_path, filename)
        with open(file_path, "r", encoding="utf-8") as file:
            try:
                data = json.load(file)
                # Добавляем данные в общий список
                if isinstance(data, list):
                    merged_data.extend(data)
                else:
                    merged_data.append(data)
            except json.JSONDecodeError as e:
                print(f"Ошибка чтения файла {filename}: {e}")

# Сохраняем объединенные данные в новый файл
with open(output_file, "w", encoding="utf-8") as output:
    json.dump(merged_data, output, ensure_ascii=False, indent=4)

print(f"Все JSON-файлы объединены в {output_file}")