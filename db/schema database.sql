CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES public.categories(id),
    description TEXT
);

CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);