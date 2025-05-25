CREATE TABLE Categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT,
    UNIQUE(name, parent_id),
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