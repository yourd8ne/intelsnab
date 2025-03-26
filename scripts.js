document.addEventListener('DOMContentLoaded', function() {
    // Используем библиотеку xlsx для работы с Excel-файлами
    const XLSX = require('xlsx');
    filePath = 'positions.xlsx';
    // Функция для загрузки и парсинга данных из Excel-файла
    function loadExcelData(filePath) {
        fetch(filePath)
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetNames = workbook.SheetNames;

                // Создаем объект для хранения данных
                const dataObj = {};

                sheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // Фильтруем пустые строки и собираем данные
                    const positions = json
                        .filter(row => row[0] !== undefined && row[0] !== '')
                        .map(row => row[0]);

                    dataObj[sheetName] = positions;
                });

                return dataObj;
            })
            .then(dataObj => {
                // Заполнение выпадающего списка категориями
                const categorySelect = document.getElementById('category-select');
                const productPositions = document.getElementById('product-positions');

                Object.keys(dataObj).forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });

                // Обработчик изменения категории
                categorySelect.addEventListener('change', function() {
                    const selectedCategory = categorySelect.value;
                    displayPositions(selectedCategory, dataObj);
                });
            })
            .catch(error => console.error('Error loading the Excel file:', error));
    }

    function displayPositions(category, dataObj) {
        const productPositions = document.getElementById('product-positions');
        productPositions.innerHTML = '';

        const positions = dataObj[category];
        positions.forEach(position => {
            const listItem = document.createElement('li');
            listItem.textContent = position;
            productPositions.appendChild(listItem);
        });
    }

    // Загрузка данных из файла positions.xlsx
    loadExcelData('positions.xlsx');
});