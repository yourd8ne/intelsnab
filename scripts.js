// --- Корзина ---
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}
function renderCartIcon() {
    let cartBtn = document.getElementById('cart-btn');
    if (!cartBtn) {
        cartBtn = document.createElement('button');
        cartBtn.id = 'cart-btn';
        cartBtn.className = 'main-button';
        cartBtn.style.marginLeft = '20px';
        cartBtn.innerHTML = 'Корзина (<span id="cart-count">0</span>)';
        const nav = document.querySelector('.main-nav');
        if (nav) nav.appendChild(cartBtn);
    }
    const countSpan = document.getElementById('cart-count');
    if (countSpan) countSpan.textContent = getCart().length;
    cartBtn.onclick = showCart;
}
function addToCart(productName, qty = 1) {
    let cart = getCart();
    const idx = cart.findIndex(item => item.name === productName);
    if (idx !== -1) {
        cart[idx].count += qty;
    } else {
        cart.push({ name: productName, count: qty });
    }
    setCart(cart);
    alert('Товар добавлен в корзину!');
    renderCartIcon();
}
function showCart() {
    let cart = getCart();
    const catalog = document.getElementById('catalog');
    if (!catalog) return;
    let html = `<div class="cart-section"><h2>Корзина</h2>`;
    if (cart.length === 0) {
        html += '<p style="font-size:1.2em; text-align:center;">Корзина пуста</p></div>';
        catalog.innerHTML = html;
        return;
    }
    html += `<ul class="cart-list">`;
    cart.forEach((item, idx) => {
        html += `
        <li>
            <span class="cart-item-name">${item.name}</span>
            <input type="number" class="cart-qty-input" data-idx="${idx}" min="1" value="${item.count}">
            <button class="cart-del-btn" data-idx="${idx}">Удалить</button>
        </li>`;
    });
    html += `</ul>`;

    html += `
    <form id="order-form">
      <label>Название компании:<br><input type="text" id="order-company" name="company"></label>
      <label>Ваше имя:<br><input type="text" id="order-name" name="name" required></label>
      <label>Телефон:<br><input type="tel" id="order-phone" name="phone" required></label>
      <label>Email:<br><input type="email" id="order-email" name="email"></label>
      <label>Комментарий:<br><textarea id="order-comment" name="comment"></textarea></label>
      <h3 style=" text-align:center;">
      Оплата производится только по безналичному расчету
      </h3>
      <button type="button" class="main-button" id="order-submit-btn">Оформить заказ</button>
      <div id="order-success" style="display:none; color:green; margin-top:10px;"></div>
    </form>
    </div>
    `;
    catalog.innerHTML = html;

    // Обработчик изменения количества
    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.onchange = function() {
            const idx = +this.dataset.idx;
            let val = Math.max(1, parseInt(this.value) || 1);
            cart[idx].count = val;
            setCart(cart);
            showCart();
            renderCartIcon();
        };
    });

    // Обработчик для удаления
    document.querySelectorAll('.cart-del-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.idx;
            cart.splice(idx, 1);
            setCart(cart);
            showCart();
            renderCartIcon();
        };
    });

    document.getElementById('order-submit-btn').onclick = sendOrder;
}
function sendOrder() {
    const cart = getCart();
    if (cart.length === 0) return;
    const now = Date.now();
    const last = +localStorage.getItem('order_last') || 0;
    if (now - last < 180000) { // 3 минуты = 180000 мс
        alert('Пожалуйста, подождите 3 минуты перед повторной отправкой заказа.');
        return;
    }
    localStorage.setItem('order_last', now);

    const orderBtn = document.getElementById('order-submit-btn');
    if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.textContent = 'Отправка...';
    }

    // Получаем данные формы
    const company = document.getElementById('order-company').value;
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const email = document.getElementById('order-email').value;
    const comment = document.getElementById('order-comment').value;

    fetch('/api/order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            items: cart,
            company,
            name,
            phone,
            email,
            comment
        })
    }).then(res => res.json())
      .then(data => {
        const orderSuccess = document.getElementById('order-success');
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.textContent = 'Оформить заказ';
        }
        if (data.status === 'ok') {
            setCart([]);
            if (orderSuccess) {
                orderSuccess.innerHTML = 'Ваш заказ в работе, менеджер с вами свяжется!';
                orderSuccess.style.display = 'block';
            }
            renderCartIcon();
            document.getElementById('order-form').reset();
        } else {
            alert('Ошибка отправки заказа: ' + (data.message || ''));
        }
      })
      .catch(() => {
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.textContent = 'Оформить заказ';
        }
        alert('Ошибка соединения с сервером!');
      });
}

// --- Глобальные переменные ---
let fullData = {}

// --- Универсальный геттер для имени товара ---
function getProductName(product) {
    return product.name || product.Наименование || product.Название || "Без названия";
}

// --- Глобальная функция загрузки каталога ---
async function fetchCatalog() {
    const catalog = document.getElementById('catalog');
    try {
        const response = await fetch('/api/catalog');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        return await response.json();
    } catch (error) {
        if (catalog) {
            catalog.innerHTML = `
                <div class="error-message">
                    <h2>Произошла ошибка при загрузке данных</h2>
                    <p>Пожалуйста, попробуйте обновить страницу или зайти позже</p>
                </div>
            `;
        }
        return {};
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ URL ---
function pathToSlug(path) {
    return path.map(s => encodeURIComponent(s.replace(/\s+/g, '-').toLowerCase())).join('/');
}
function slugToPath(slug) {
    return slug.split('/').map(s => decodeURIComponent(s.replace(/-/g, ' ')));
}

// --- РЕНДЕР РАЗДЕЛОВ/ПОДРАЗДЕЛОВ С ИЗМЕНЕНИЕМ URL ---
function renderAnyLevel(data, path = [], push = false) {
    if (push) {
        const slug = pathToSlug(path);
        history.pushState({ path }, '', slug ? `/category/${slug}` : '/');
    }

    let node = data;
    for (const key of path) {
        node = node[key];
    }

    // Если node — массив товаров, и выбран только один товар
    if (Array.isArray(node) && node.length === 1) {
        renderProductDetails(node[0], path, true);
        return;
    }

    // Если node — объект товара
    if (isProduct(node)) {
        renderProductDetails(node, path, true);
        return;
    }

    const catalog = document.getElementById('catalog');
    catalog.innerHTML = '';
    catalog.appendChild(renderBreadcrumbs(path));

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
            productTile.innerHTML = `<h3>${getProductName(product)}</h3>`;
            productTile.addEventListener('click', () => {
                renderProductDetails(product, path, true);
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
        // Абсолютный путь к картинке!
        const imgName = key.replace(/\s+/g, '_').toLowerCase();
        const imgPath = `/img/${imgName}.jpg`;
        subCategoryTile.innerHTML = `<img src="${imgPath}" alt="${key}" onerror="this.style.display='none'"><h2>${key}</h2>`;
        subCategoryTile.addEventListener('click', () => {
            renderAnyLevel(data, [...path, key], true);
        });
        subCategoryGrid.appendChild(subCategoryTile);
    }
    catalog.appendChild(subCategoryGrid);
}

// --- РЕНДЕР КАРТОЧКИ ТОВАРА С ИЗМЕНЕНИЕМ URL ---
function renderProductDetails(product, path, push = false) {
    if (push) {
        const slug = pathToSlug(path.concat([getProductName(product)]));
        history.pushState({ path: path.concat([getProductName(product)]) }, '', `/product/${slug}`);
    }

    const catalog = document.getElementById('catalog');
    catalog.innerHTML = '';
    catalog.appendChild(renderBreadcrumbs(path));

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
            <input type="number" min="1" value="1" id="product-qty-input" style="width:120px;">
            <button class="contact-button" data-product='${encodeURIComponent(getProductName(product))}'>В корзину</button>
        </div>
    `;
    catalog.appendChild(details);
    details.querySelector('.contact-button').addEventListener('click', function() {
        const qty = Math.max(1, parseInt(document.getElementById('product-qty-input').value) || 1);
        addToCart(decodeURIComponent(this.dataset.product), qty);
    });
}

// --- Для массивов делаем красивый список ---
function renderArray(arr) {
    if (Array.isArray(arr)) {
        return '<ul class="char-list">' + arr.map(v => `<li>${v}</li>`).join('') + '</ul>';
    }
    if (typeof arr === 'string' && arr.includes(',')) {
        return '<ul class="char-list">' + arr.split(',').map(v => `<li>${v.trim()}</li>`).join('') + '</ul>';
    }
    return arr || '';
}

// --- Хлебные крошки с правильными переходами ---
function renderBreadcrumbs(path = []) {
    const breadcrumbs = document.createElement('div');
    breadcrumbs.className = 'breadcrumbs';
    let html = `<span class="breadcrumb-link" data-idx="-1">Каталог</span>`;
    if (path.length > 0) {
        html += ' > ' + path.map((name, idx) =>
            `<span class="breadcrumb-link" data-idx="${idx}">${name}</span>`
        ).join(' > ');
    }
    breadcrumbs.innerHTML = html;
    breadcrumbs.querySelector('.breadcrumb-link[data-idx="-1"]').addEventListener('click', () => {
        renderAnyLevel(fullData, [], true);
    });
    breadcrumbs.querySelectorAll('.breadcrumb-link[data-idx]:not([data-idx="-1"])').forEach(link => {
        link.addEventListener('click', (e) => {
            const idx = +e.target.dataset.idx;
            renderAnyLevel(fullData, path.slice(0, idx + 1), true);
        });
    });
    return breadcrumbs;
}

// --- Проверка, является ли объект товаром ---
function isProduct(node) {
    return node && typeof node === 'object' && ('name' in node || 'название' in node);
}

// --- SPA: обработка истории и загрузки ---
window.addEventListener('popstate', function(event) {
    handleUrl();
});
function handleUrl() {
    const pathname = window.location.pathname;
    if (pathname === '/' || pathname === '/index.html') {
        renderAnyLevel(fullData, []);
        return;
    }
    if (pathname.startsWith('/category/')) {
        const slug = pathname.replace('/category/', '');
        const path = slugToPath(slug);
        renderAnyLevel(fullData, path);
        return;
    }
    if (pathname.startsWith('/product/')) {
        const slug = pathname.replace('/product/', '');
        const path = slugToPath(slug);
        const productName = path[path.length - 1];
        const catPath = path.slice(0, -1);
        let node = fullData;
        for (const key of catPath) {
            node = node[key];
        }
        let product = null;
        if (Array.isArray(node)) {
            product = node.find(p => getProductName(p).toLowerCase() === productName.toLowerCase());
        }
        if (product) {
            renderProductDetails(product, catPath);
        } else {
            document.getElementById('catalog').innerHTML = '<p>Товар не найден</p>';
        }
        return;
    }
    renderAnyLevel(fullData, []);
}

// --- Загрузка каталога и старт ---
document.addEventListener('DOMContentLoaded', async () => {
    fullData = await fetchCatalog();
    renderCartIcon();
    handleUrl();
});
