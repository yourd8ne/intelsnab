-- Создаем таблицу для категорий товаров
CREATE TABLE Categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Уникальный идентификатор категории
    name TEXT NOT NULL,                   -- Название категории
    description TEXT                      -- Описание категории (опционально)
);
-- Создаем таблицу для товаров
CREATE TABLE Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Уникальный идентификатор товара
    name TEXT NOT NULL,                   -- Название товара
    price REAL NOT NULL,                  -- Цена товара
    category_id INTEGER NOT NULL,         -- Ссылка на категорию товара
    description TEXT,                     -- Описание товара (опционально)
    material TEXT,                        -- Материалы товара (опционально)
    diameters TEXT,                       -- Диаметры товара (опционально)
    lengths TEXT,                         -- Длины товара (опционально)
    FOREIGN KEY (category_id) REFERENCES Categories (id) ON DELETE CASCADE
);