document.addEventListener('DOMContentLoaded', async () => {
    const catalog = document.getElementById('catalog');

    // Функция для загрузки данных из API
    async function fetchCatalog() {
        const response = await fetch('http://127.0.0.1:5000/api/catalog');
        if (!response.ok) {
            console.error('Ошибка загрузки данных');
            return {};
        }
        return await response.json();
    }

    // Функция для рендеринга списка категорий
    function renderCategories(data) {
        catalog.innerHTML = ''; // Очищаем каталог
        const categoryList = document.createElement('ul'); // Создаем список категорий

        for (const category of Object.keys(data)) {
            const categoryItem = document.createElement('li'); // Элемент списка
            categoryItem.textContent = category;
            categoryItem.style.cursor = 'pointer';
            categoryItem.addEventListener('click', () => renderProducts(data, category)); // Переход к товарам категории

            categoryList.appendChild(categoryItem);
        }

        catalog.appendChild(categoryList);
    }

    // Функция для рендеринга товаров в категории
    function renderProducts(data, category) {
        catalog.innerHTML = ''; // Очищаем каталог

        const backButton = document.createElement('button');
        backButton.textContent = 'Назад к категориям';
        backButton.addEventListener('click', () => renderCategories(data)); // Возврат к списку категорий
        catalog.appendChild(backButton);

        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = category;
        catalog.appendChild(categoryTitle);

        const productList = document.createElement('ul'); // Список товаров

        data[category].forEach(product => {
            const productItem = document.createElement('li'); // Элемент списка товаров
            productItem.textContent = product.name;
            productItem.style.cursor = 'pointer';
            productItem.addEventListener('click', () => renderProductDetails(product)); // Переход к деталям товара

            productList.appendChild(productItem);
        });

        catalog.appendChild(productList);
    }

    // Функция для рендеринга деталей товара
    function renderProductDetails(product) {
        catalog.innerHTML = ''; // Очищаем каталог

        const backButton = document.createElement('button');
        backButton.textContent = 'Назад к товарам';
        backButton.addEventListener('click', async () => {
            const data = await fetchCatalog();
            const category = Object.keys(data).find(cat =>
                data[cat].some(p => p.name === product.name)
            );
            renderProducts(data, category);
        });
        catalog.appendChild(backButton);

        const productTitle = document.createElement('h2');
        productTitle.textContent = product.name;
        catalog.appendChild(productTitle);

        if (product.description) {
            const productDescription = document.createElement('p');
            productDescription.textContent = `Описание: ${product.description}`;
            catalog.appendChild(productDescription);
        }

        if (product.material && product.material.length > 0) {
            const productMaterial = document.createElement('p');
            productMaterial.textContent = `Материалы: ${product.material}`;
            catalog.appendChild(productMaterial);
        }

        if (product.diameters && product.diameters.length > 0) {
            const productDiameters = document.createElement('p');
            productDiameters.textContent = `Диаметры: ${product.diameters}`;
            catalog.appendChild(productDiameters);
        }

        if (product.lengths && product.lengths.length > 0) {
            const productLengths = document.createElement('p');
            productLengths.textContent = `Длины: ${product.lengths}`;
            catalog.appendChild(productLengths);
        }
    }

    // Загружаем и рендерим категории
    const data = await fetchCatalog();
    renderCategories(data);
});