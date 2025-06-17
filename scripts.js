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

    // Всегда назначаем обработчик!
    cartBtn.onclick = showCart;
}
function addToCart(productName) {
    let cart = getCart();
    const idx = cart.findIndex(item => item.name === productName);
    if (idx !== -1) {
        cart[idx].count += 1;
    } else {
        cart.push({ name: productName, count: 1 });
    }
    setCart(cart);
    alert('Товар добавлен в корзину!');
    renderCartIcon();
}
function showCart() {
    let cart = getCart();
    const catalog = document.getElementById('catalog');
    if (!catalog) return;
    // --- Новый контейнер ---
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
            <button class="cart-qty-btn" data-idx="${idx}" data-action="minus">-</button>
            <span class="cart-qty">${item.count}</span>
            <button class="cart-qty-btn" data-idx="${idx}" data-action="plus">+</button>
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
      <button type="button" class="main-button" id="order-submit-btn">Заказать</button>
      <div id="order-success" style="display:none; color:green; margin-top:10px;"></div>
    </form>
    </div>
    `;
    catalog.innerHTML = html;

    // Обработчики для +/-
    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.idx;
            const action = this.dataset.action;
            if (action === 'plus') cart[idx].count += 1;
            if (action === 'minus' && cart[idx].count > 1) cart[idx].count -= 1;
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
            orderBtn.textContent = 'Заказать';
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
            orderBtn.textContent = 'Заказать';
        }
        alert('Ошибка соединения с сервером!');
      });
}

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
        catalog.appendChild(renderBreadcrumbs([]));
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML += `<span>Результаты поиска: <b>${query}</b></span>`;
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
        let node = data;
        for (const key of path) {
            node = node[key];
        }

        // Если node — массив товаров, и выбран только один товар
        if (Array.isArray(node) && node.length === 1) {
            renderProductDetails(node[0]);
            return;
        }

        // Если node — объект товара (например, у вас товары — объекты с определёнными полями)
        if (isProduct(node)) {
            renderProductDetails(node);
            return;
        }

        catalog.innerHTML = '';
        catalog.appendChild(renderBreadcrumbs(path));

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
            // Попытка найти картинку по имени категории
            const imgName = key.replace(/\s+/g, '_').toLowerCase();
            const imgPath = `img/${imgName}.jpg`; // или .png, если нужно
            subCategoryTile.innerHTML = `<img src="${imgPath}" alt="${key}" onerror="this.style.display='none'"><div>${key}</div>`;
            subCategoryTile.addEventListener('click', () => {
                renderAnyLevel(fullData, [...path, key]);
            });
            subCategoryGrid.appendChild(subCategoryTile);
        }
        catalog.appendChild(subCategoryGrid);
    }

    function renderProductDetails(product, path) {
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
                <button class="contact-button" data-product='${encodeURIComponent(getProductName(product))}'>В корзину</button>
            </div>
        `;
        catalog.appendChild(details);
        details.querySelector('.contact-button').addEventListener('click', function() {
            addToCart(decodeURIComponent(this.dataset.product));
        });
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

    function renderBreadcrumbs(path = []) {
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        // Кнопка "Каталог" всегда первая
        let html = `<span class="breadcrumb-link" data-idx="-1">Каталог</span>`;
        if (path.length > 0) {
            html += ' > ' + path.map((name, idx) =>
                `<span class="breadcrumb-link" data-idx="${idx}">${name}</span>`
            ).join(' > ');
        }
        breadcrumbs.innerHTML = html;
        // Обработчик для "Каталог"
        breadcrumbs.querySelector('.breadcrumb-link[data-idx="-1"]').addEventListener('click', () => {
            renderAnyLevel(fullData, []);
        });
        // Обработчики для остальных крошек
        breadcrumbs.querySelectorAll('.breadcrumb-link[data-idx]:not([data-idx="-1"])').forEach(link => {
            link.addEventListener('click', (e) => {
                const idx = +e.target.dataset.idx;
                renderAnyLevel(fullData, path.slice(0, idx + 1));
            });
        });
        return breadcrumbs;
    }

    // Показываем иконку корзины при загрузке
    renderCartIcon();

    renderAnyLevel(fullData);
});

function isProduct(node) {
    // Например, если у товара всегда есть поле "name" или "название"
    return node && typeof node === 'object' && ('name' in node || 'название' in node);
}

// Открытие/закрытие модального окна
document.getElementById('close-callback-modal').onclick = function() {
    document.getElementById('callback-modal').style.display = 'none';
    document.getElementById('callback-form').reset();
    document.getElementById('callback-success').style.display = 'none';
};
window.onclick = function(event) {
    if (event.target === document.getElementById('callback-modal')) {
        document.getElementById('callback-modal').style.display = 'none';
        document.getElementById('callback-form').reset();
        document.getElementById('callback-success').style.display = 'none';
    }
};

// Отправка формы
document.getElementById('callback-form').onsubmit = function(e) {
    e.preventDefault();
    const now = Date.now();
    const last = +localStorage.getItem('callback_last') || 0;
    if (now - last < 180000) { // 3 минуты = 180000 мс
        alert('Пожалуйста, подождите 3 минуты перед повторной отправкой.');
        return;
    }
    localStorage.setItem('callback_last', now);

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    const formData = new FormData(this);
    fetch('/api/callback', {
        method: 'POST',
        body: JSON.stringify({
            company: formData.get('company'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            comment: formData.get('comment')
        }),
        headers: {'Content-Type': 'application/json'}
    }).then(res => res.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = 'Отправить';
        if (data.status === 'ok') {
            document.getElementById('callback-success').innerHTML =
                'Ваша заявка отправлена! Мы свяжемся с вами в течение суток.';
            document.getElementById('callback-success').style.display = 'block';
            this.reset();
        } else {
            alert('Ошибка отправки: ' + (data.message || ''));
        }
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = 'Отправить';
        alert('Ошибка соединения с сервером!');
      });
};

document.getElementById('callback-link').onclick = function(e) {
    e.preventDefault();
    document.getElementById('callback-modal').style.display = 'block';
};
