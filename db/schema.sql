CREATE TABLE Categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT,
    FOREIGN KEY (parent_id) REFERENCES Categories(id) ON DELETE CASCADE
);

CREATE TABLE Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    article TEXT,
    description TEXT,
    material TEXT,
    diameters TEXT,
    lengths TEXT,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
);

WITH RECURSIVE subcategories(id) AS (
  SELECT id FROM Categories WHERE id = ?
  UNION ALL
  SELECT c.id FROM Categories c
  JOIN subcategories s ON c.parent_id = s.id
)
SELECT * FROM Products WHERE category_id IN (SELECT id FROM subcategories);