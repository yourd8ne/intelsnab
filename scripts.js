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
    renderAnyLevel(fullData);

    function renderAnyLevel(data, path = []) {
        catalog.innerHTML = '';

        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = path.map((name, idx) => {
            return `<span class="breadcrumb-link" data-idx="${idx}">${name}</span>`;
        }).join(' > ');
        breadcrumbs.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const idx = +e.target.dataset.idx;
                renderAnyLevel(fullData, path.slice(0, idx + 1));
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
            const productList = document.createElement('ul');
            productList.className = 'subcategory-list';
            current.forEach(product => {
                const productItem = document.createElement('li');
                productItem.className = 'subcategory-item';
                productItem.textContent = getProductName(product);
                productItem.addEventListener('click', () => {
                    renderProductDetails(product, path);
                });
                productList.appendChild(productItem);
            });
            catalog.appendChild(productList);
            return;
        }

        // Если это объект с подкатегориями
        const keys = Object.keys(current);
        if (keys.length === 0) {
            catalog.innerHTML += '<p>В этой категории пока нет подкатегорий</p>';
            return;
        }
        const subCategoryList = document.createElement('ul');
        subCategoryList.className = 'subcategory-list';
        for (const key of keys) {
            const subCategoryItem = document.createElement('li');
            subCategoryItem.className = 'subcategory-item';
            subCategoryItem.textContent = key;
            subCategoryItem.addEventListener('click', () => {
                renderAnyLevel(fullData, [...path, key]);
            });
            subCategoryList.appendChild(subCategoryItem);
        }
        catalog.appendChild(subCategoryList);
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

        // Карточка товара
        const details = document.createElement('div');
        details.className = 'product-details-plain';
        details.innerHTML = `
            <div class="product-details-text">
                <div class="product-details-name">${getProductName(product)}</div>
                ${product.description || product.Описание ? `<div>${product.description || product.Описание}</div>` : ''}
                ${product.material || product.Материал ? `<div>Материал: ${product.material || product.Материал}</div>` : ''}
                ${product.diameters || product.Диаметры ? `<div>Диаметры: ${product.diameters || product.Диаметры}</div>` : ''}
                ${product.lengths || product.Длины ? `<div>Длины: ${product.lengths || product.Длины}</div>` : ''}
            </div>
            <div class="product-actions">
                <button class="contact-button" onclick="location.href='contacts.html'">Заказать</button>
            </div>
        `;
        catalog.appendChild(details);
    }
});
