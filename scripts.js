document.addEventListener('DOMContentLoaded', async () => {
    const catalog = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    let fullData = {};
    let navStack = []; // Для возврата на прежнее место

    async function fetchCatalog() {
        try {
            const response = await fetch('http://194.87.76.239:5001/api/catalog');
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

    function renderMainCategories(data) {
        navStack = [];
        catalog.innerHTML = '';
        if (Object.keys(data).length === 0) {
            catalog.innerHTML = `
                <div class="empty-message">
                    <h2>Каталог пуст</h2>
                    <p>В данный момент товары отсутствуют</p>
                </div>
            `;
            return;
        }
        const categoryList = document.createElement('ul');
        categoryList.className = 'main-category-list';
        for (const mainCategory of Object.keys(data)) {
            const categoryItem = document.createElement('li');
            categoryItem.className = 'main-category-item';
            categoryItem.textContent = mainCategory;
            categoryItem.addEventListener('click', () => {
                navStack.push({type: 'main', scroll: window.scrollY});
                renderSubCategories(data, mainCategory);
            });
            categoryList.appendChild(categoryItem);
        }
        catalog.appendChild(categoryList);
    }

    function renderSubCategories(data, mainCategory) {
        catalog.innerHTML = '';
        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = mainCategory;
        categoryTitle.className = 'main-category-title';
        catalog.appendChild(categoryTitle);

        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = `<span class="breadcrumb-link" data-level="main">${mainCategory}</span>`;
        breadcrumbs.querySelector('.breadcrumb-link').addEventListener('click', () => {
            renderMainCategories(data);
            window.scrollTo(0, 0);
        });
        catalog.appendChild(breadcrumbs);

        const subCategories = data[mainCategory];
        if (!subCategories || Object.keys(subCategories).length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'В этой категории пока нет подкатегорий';
            catalog.appendChild(emptyMessage);
        } else {
            const subCategoryList = document.createElement('ul');
            subCategoryList.className = 'subcategory-list';
            for (const subCategory of Object.keys(subCategories)) {
                const subCategoryItem = document.createElement('li');
                subCategoryItem.className = 'subcategory-item';
                subCategoryItem.textContent = subCategory;
                subCategoryItem.addEventListener('click', () => {
                    navStack.push({type: 'sub', mainCategory, scroll: window.scrollY});
                    renderProducts(data, mainCategory, subCategory);
                });
                subCategoryList.appendChild(subCategoryItem);
            }
            catalog.appendChild(subCategoryList);
        }
        // Кнопка "Назад к категориям" внизу
        const backButton = document.createElement('button');
        backButton.className = 'back-button bottom-back';
        backButton.textContent = '← Назад к категориям';
        backButton.addEventListener('click', () => {
            renderMainCategories(data);
            window.scrollTo(0, 0);
        });
        catalog.appendChild(backButton);
    }

    function renderProducts(data, mainCategory, subCategory) {
        catalog.innerHTML = '';
        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = `
            <span class="breadcrumb-link" data-level="main">${mainCategory}</span> > 
            <span class="breadcrumb-link" data-level="sub">${subCategory}</span>
        `;
        const [mainCrumb, subCrumb] = breadcrumbs.querySelectorAll('.breadcrumb-link');
        mainCrumb.addEventListener('click', () => {
            renderMainCategories(data);
            window.scrollTo(0, 0);
        });
        subCrumb.addEventListener('click', () => {
            renderSubCategories(data, mainCategory);
            window.scrollTo(0, 0);
        });
        catalog.appendChild(breadcrumbs);

        const products = data[mainCategory][subCategory];
        if (!products || products.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'В этой подкатегории пока нет товаров';
            catalog.appendChild(emptyMessage);
            return;
        }
        // Вертикальный список товаров
        const productList = document.createElement('ul');
        productList.className = 'subcategory-list';
        products.forEach(product => {
            const productItem = document.createElement('li');
            productItem.className = 'subcategory-item';
            productItem.textContent = product.name;
            productItem.addEventListener('click', () => {
                navStack.push({type: 'products', mainCategory, subCategory, scroll: window.scrollY});
                renderProductDetails(product, data, mainCategory, subCategory);
            });
            productList.appendChild(productItem);
        });
        catalog.appendChild(productList);

        // Кнопка "Назад к подкатегориям" внизу
        const backButton = document.createElement('button');
        backButton.className = 'back-button bottom-back';
        backButton.textContent = '← Назад к подкатегориям';
        backButton.addEventListener('click', () => {
            renderSubCategories(data, mainCategory);
            window.scrollTo(0, navStack.length ? navStack[navStack.length-1].scroll : 0);
        });
        catalog.appendChild(backButton);
    }

    function renderProductDetails(product, data, mainCategory, subCategory) {
        catalog.innerHTML = '';
        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = `
            <span class="breadcrumb-link" data-level="main">${mainCategory}</span> > 
            <span class="breadcrumb-link" data-level="sub">${subCategory}</span> > 
            <span>${product.name}</span>
        `;
        const [mainCrumb, subCrumb] = breadcrumbs.querySelectorAll('.breadcrumb-link');
        mainCrumb.addEventListener('click', () => {
            renderMainCategories(data);
            window.scrollTo(0, 0);
        });
        subCrumb.addEventListener('click', () => {
            renderSubCategories(data, mainCategory);
            window.scrollTo(0, 0);
        });
        catalog.appendChild(breadcrumbs);

        // Просто текстовая карточка
        const details = document.createElement('div');
        details.className = 'product-details-plain';
        details.innerHTML = `
            <div class="product-details-text">
                <div class="product-details-name">${product.name}</div>
                ${product.description ? `<div>${product.description}</div>` : ''}
                ${product.material ? `<div>Материал: ${product.material}</div>` : ''}
                ${product.diameters ? `<div>Диаметры: ${product.diameters}</div>` : ''}
                ${product.lengths ? `<div>Длины: ${product.lengths}</div>` : ''}
            </div>
            <div class="product-actions">
                <button class="contact-button" onclick="location.href='contacts.html'">Заказать</button>
            </div>
        `;
        catalog.appendChild(details);

        // Кнопка "Назад к товарам" внизу
        const backButton = document.createElement('button');
        backButton.className = 'back-button bottom-back';
        backButton.textContent = '← Назад к товарам';
        backButton.addEventListener('click', () => {
            renderProducts(data, mainCategory, subCategory);
            window.scrollTo(0, navStack.length ? navStack[navStack.length-1].scroll : 0);
        });
        catalog.appendChild(backButton);
    }

    // --- Поиск по товарам ---
    function searchProducts(query) {
        query = query.trim().toLowerCase();
        if (!query) {
            renderMainCategories(fullData);
            return;
        }
        // Собираем все товары из всех категорий
        let found = [];
        for (const mainCategory of Object.keys(fullData)) {
            for (const subCategory of Object.keys(fullData[mainCategory])) {
                for (const product of fullData[mainCategory][subCategory]) {
                    if ((product.name || '').toLowerCase().includes(query)) {
                        found.push({
                            mainCategory,
                            subCategory,
                            product
                        });
                    }
                }
            }
        }
        catalog.innerHTML = '';
        // Хлебные крошки
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = `<span>Результаты поиска</span>`;
        catalog.appendChild(breadcrumbs);

        if (found.length === 0) {
            catalog.innerHTML += `<div class="empty-message"><h2>Ничего не найдено</h2></div>`;
            return;
        }
        const productList = document.createElement('ul');
        productList.className = 'subcategory-list';
        found.forEach(item => {
            const productItem = document.createElement('li');
            productItem.className = 'subcategory-item';
            productItem.innerHTML = `<b>${item.product.name}</b><br>
                <span style="font-size:0.95em;color:#888">${item.mainCategory} / ${item.subCategory}</span>`;
            productItem.addEventListener('click', () => {
                renderProductDetails(item.product, fullData, item.mainCategory, item.subCategory);
            });
            productList.appendChild(productItem);
        });
        catalog.appendChild(productList);
    }

    // --- Обработчик поиска ---
    searchInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    // --- Загрузка каталога ---
    fullData = await fetchCatalog();
    renderMainCategories(fullData);
});
