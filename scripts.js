document.addEventListener('DOMContentLoaded', async () => {
    const catalog = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    let fullData = {};

    // Универсальный геттер для имени товара
    function getProductName(product) {
        return product.name || product.Наименование || product.Название || "Без названия";
    }

    async function fetchCatalog() {
        try {
            const response = await fetch('http://localhost:5001/api/catalog');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            return await response.json();
        } catch (error) {
            catalog.innerHTML = `
                <div class="error-message">
                    <h2>Произошла ошибка при загрузке данных</h2>
                    <p>Пожалуйста, попробуйте обновить страницу или зайти позже</p>
                </div>
            `;
            return {};
        }
    }

    // --- Загрузка каталога ---
    fullData = await fetchCatalog();

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length === 0) {
            renderAnyLevel(fullData);
            return;
        }
        const results = [];
        function searchTree(node, path = []) {
            if (Array.isArray(node)) {
                node.forEach(product => {
                    const name = getProductName(product).toLowerCase();
                    if (name.includes(query)) {
                        results.push({ product, path });
                    }
                });
            } else if (typeof node === 'object' && node !== null) {
                for (const key in node) {
                    searchTree(node[key], [...path, key]);
                }
            }
        }
        searchTree(fullData);

        catalog.innerHTML = '';
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = `<span>Результаты поиска: <b>${query}</b></span>`;
        catalog.appendChild(breadcrumbs);

        if (results.length === 0) {
            catalog.innerHTML += '<p>Ничего не найдено</p>';
            return;
        }
        const productGrid = document.createElement('div');
        productGrid.className = 'product-grid';
        results.forEach(({ product, path }) => {
            const productTile = document.createElement('div');
            productTile.className = 'product-tile';
            productTile.innerHTML = `<div>${getProductName(product)}</div>
                <div class="search-path">${path.join(' / ')}</div>`;
            productTile.addEventListener('click', () => {
                renderProductDetails(product, path);
            });
            productGrid.appendChild(productTile);
        });
        catalog.appendChild(productGrid);
    });

    function renderAnyLevel(data, path = []) {
        catalog.innerHTML = '';

        // "Каталог" как первая хлебная крошка-ссылка
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML =
            `<span class="breadcrumb-link" data-idx="-1">Каталог</span>` +
            (path.length ? ' > ' : '') +
            path.map((name, idx) =>
                `<span class="breadcrumb-link" data-idx="${idx}">${name}</span>`
            ).join(' > ');

        breadcrumbs.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const idx = +e.target.dataset.idx;
                if (idx === -1) {
                    renderAnyLevel(fullData, []);
                } else {
                    renderAnyLevel(fullData, path.slice(0, idx + 1));
                }
            });
        });
        catalog.appendChild(breadcrumbs);

        // Получаем текущий уровень данных
        let current = data;
        for (const key of path) {
            current = current[key];
        }

        // Если это массив товаров
        if (Array.isArray(current)) {
            if (current.length === 0) {
                catalog.innerHTML += '<p>В этой категории пока нет товаров</p>';
                return;
            }
            const productGrid = document.createElement('div');
            productGrid.className = 'product-grid';
            current.forEach(product => {
                const productTile = document.createElement('div');
                productTile.className = 'product-tile';
                productTile.textContent = getProductName(product);
                productTile.addEventListener('click', () => {
                    renderProductDetails(product, path);
                });
                productGrid.appendChild(productTile);
            });
            catalog.appendChild(productGrid);
            return;
        }

        // Если это объект с подкатегориями
        const keys = Object.keys(current);
        if (keys.length === 0) {
            catalog.innerHTML += '<p>В этой категории пока нет подкатегорий</p>';
            return;
        }
        const subCategoryGrid = document.createElement('div');
        subCategoryGrid.className = 'category-grid';
        for (const key of keys) {
            const subCategoryTile = document.createElement('div');
            subCategoryTile.className = 'category-tile';
            subCategoryTile.textContent = key;
            subCategoryTile.addEventListener('click', () => {
                renderAnyLevel(fullData, [...path, key]);
            });
            subCategoryGrid.appendChild(subCategoryTile);
        }
        catalog.appendChild(subCategoryGrid);
    }

    function renderProductDetails(product, path) {
        catalog.innerHTML = '';
        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = path.map((name, idx) => {
            return `<span class="breadcrumb-link" data-idx="${idx}">${name}</span>`;
        }).join(' > ') + ` > <span>${getProductName(product)}</span>`;
        breadcrumbs.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const idx = +e.target.dataset.idx;
                renderAnyLevel(fullData, path.slice(0, idx + 1));
            });
        });
        catalog.appendChild(breadcrumbs);

        // Характеристики
        let characteristics = '';
        if (
            product.Описание || product.description ||
            product.Материал || product.material ||
            product.Диаметр || product.diameter ||
            product.Длина || product.length
        ) {
            characteristics = `<div class="product-characteristics">
                <b>Характеристики:</b>
                <ul>
                    ${product.Описание || product.description ? `<li>${product.Описание || product.description}</li>` : ''}
                    ${product.Материал || product.material ? `<li>Материал: ${product.Материал || product.material}</li>` : ''}
                    ${product.Диаметр || product.diameter ? `<li>Диаметр:${renderArray(product.Диаметр || product.diameter)}</li>` : ''}
                    ${product.Длина || product.length ? `<li>Длина:${renderArray(product.Длина || product.length)}</li>` : ''}
                </ul>
            </div>`;
        }

        // Карточка товара
        const details = document.createElement('div');
        details.className = 'product-details-card';
        details.innerHTML = `
            <div class="product-details-name">${getProductName(product)}</div>
            ${characteristics}
            <div class="product-template-info">
                <div><b>Наличие:</b> под заказ</div>
                <div><b>Стоимость:</b> по запросу</div>
                <div><b>Доставка:</b> Бесплатная до ТК и по Нижнему Новгороду</div>
                <div><b>Срок поставки:</b> от 3 дней</div>
            </div>
            <div class="product-actions">
                <button class="contact-button" onclick="location.href='contacts.html'">Заказать</button>
            </div>
        `;
        catalog.appendChild(details);
    }

    // Для массивов делаем красивый список
    function renderArray(arr) {
        if (Array.isArray(arr)) {
            return '<ul class="char-list">' + arr.map(v => `<li>${v}</li>`).join('') + '</ul>';
        }
        // Если строка с запятыми — разбить
        if (typeof arr === 'string' && arr.includes(',')) {
            return '<ul class="char-list">' + arr.split(',').map(v => `<li>${v.trim()}</li>`).join('') + '</ul>';
        }
        return arr || '';
    }
});
