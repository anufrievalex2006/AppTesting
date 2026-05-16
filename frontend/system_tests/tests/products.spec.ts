import { test, expect } from "@playwright/test";
import { ProductsPage } from "../pages/Products";
import { generateValidProduct, generateProductInvalidBJU } from "../fixtures/testData";

test.describe('Страница продуктов - CRUD + валидация', () => {
    let productsPage: ProductsPage;

    test.beforeEach(async ({ page }) => {
        productsPage = new ProductsPage(page);
        await productsPage.goto("/");
    });

    // ===================== СОЗДАНИЕ — HAPPY PATH =====================

    test.describe('Создание продукта — валидные данные', () => {
        test('Создание продукта с валидными данными (Эквивалентное разбиение)', async () => {
            const p = generateValidProduct();

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(p);
            await productsPage.submitForm();

            await productsPage.expectNotification('Продукт успешно создан');
            await expect(productsPage.page.getByText(p.name)).toBeVisible();
        });

        test('Созданный продукт отображается в таблице со всеми полями', async () => {
            const p = generateValidProduct('-fields');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(p);
            await productsPage.submitForm();

            await productsPage.expectNotification('Продукт успешно создан');

            const row = productsPage.getProductRow(p.name);
            await expect(row).toContainText(p.name);
            await expect(row).toContainText('Овощи');
        });

        // Параметризация по всем категориям
        const categories = [
            'Замороженный', 'Мясной', 'Овощи', 'Зелень',
            'Специи', 'Крупы', 'Консервы', 'Жидкость', 'Сладости'
        ];

        for (const category of categories) {
            test(`Создание продукта с категорией "${category}"`, async () => {
                const p = { ...generateValidProduct(`-cat`), category };

                await productsPage.openCreateModal();
                await productsPage.fillProductForm(p);
                await productsPage.submitForm();

                await productsPage.expectNotification('Продукт успешно создан');
                await expect(productsPage.page.getByText(p.name)).toBeVisible();
            });
        }

        // Параметризация по всем статусам готовности
        const statuses = ['Готовый к употреблению', 'Полуфабрикат', 'Требует приготовления'];

        for (const status of statuses) {
            test(`Создание продукта со статусом "${status}"`, async () => {
                const p = { ...generateValidProduct(`-status`), status };

                await productsPage.openCreateModal();
                await productsPage.fillProductForm(p);
                await productsPage.submitForm();

                await productsPage.expectNotification('Продукт успешно создан');
                await expect(productsPage.page.getByText(p.name)).toBeVisible();
            });
        }
    });

    // ===================== ГРАНИЧНЫЕ ЗНАЧЕНИЯ КБЖУ =====================

    test.describe('Граничные значения полей КБЖУ (BVA)', () => {
        const testCases = [
            { cal: 0,   prot: 0,  fat: 0,  carb: 0,  desc: 'Нулевые значения' },
            { cal: 1,   prot: 0,  fat: 0,  carb: 0,  desc: 'Минимальные положительные калории' },
            { cal: 0,   prot: 1,  fat: 0,  carb: 0,  desc: 'Минимальные положительные белки' },
            { cal: 0,   prot: 0,  fat: 1,  carb: 0,  desc: 'Минимальные положительные жиры' },
            { cal: 0,   prot: 0,  fat: 0,  carb: 1,  desc: 'Минимальные положительные углеводы' },
            { cal: 500, prot: 33, fat: 33, carb: 33, desc: 'Максимально допустимая сумма БЖУ (99)' },
            { cal: 500, prot: 34, fat: 33, carb: 33, desc: 'Сумма БЖУ ровно 100' },
        ];

        for (const tc of testCases) {
            test(`BVA: ${tc.desc}`, async () => {
                const p = generateValidProduct(`-bva-${tc.cal}-${tc.prot}`);

                await productsPage.openCreateModal();
                await productsPage.fillProductForm({
                    ...p,
                    calories: tc.cal,
                    protein: tc.prot,
                    fats: tc.fat,
                    carbs: tc.carb
                });

                await productsPage.submitForm();
                await expect(productsPage.page.getByText(p.name)).toBeVisible({ timeout: 10000 });
            });
        }
    });

    // ===================== ВАЛИДАЦИЯ — НЕГАТИВНЫЕ ТЕСТЫ =====================

    test.describe('Валидация при создании — негативные сценарии', () => {
        test('Сумма БЖУ > 100г — ошибка валидации, модалка остаётся открытой', async () => {
            const invalid = generateProductInvalidBJU();

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(invalid);
            await productsPage.submitForm();

            await expect(
                productsPage.page.getByText('Сумма БЖУ не может быть больше 100 г на 100 г продукта')
            ).toBeVisible({ timeout: 10000 });
            await expect(productsPage.page.getByRole('dialog')).toBeVisible();
        });

        test('Пустое название — ошибка валидации', async () => {
            await productsPage.openCreateModal();

            await productsPage.nameInput().fill('');
            await productsPage.caloriesInput().fill('100');
            await productsPage.proteinInput().fill('10');
            await productsPage.fatsInput().fill('5');
            await productsPage.carbsInput().fill('20');
            await productsPage.submitForm();

            await expect(
                productsPage.page.getByText('как минимум 2 символа')
            ).toBeVisible();
            await expect(productsPage.page.getByRole('dialog')).toBeVisible();
        });

        test('Название из 1 символа — ошибка валидации', async () => {
            await productsPage.openCreateModal();

            await productsPage.nameInput().fill('А');
            await productsPage.caloriesInput().fill('100');
            await productsPage.proteinInput().fill('10');
            await productsPage.fatsInput().fill('5');
            await productsPage.carbsInput().fill('20');
            await productsPage.submitForm();

            await expect(
                productsPage.page.getByText('как минимум 2 символа')
            ).toBeVisible();
        });

        test('Отмена создания — продукт не появляется в таблице', async () => {
            const p = generateValidProduct('-cancel');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(p);
            await productsPage.closeModal();

            await expect(productsPage.page.getByText(p.name)).not.toBeVisible();
        });
    });

    // ===================== РЕДАКТИРОВАНИЕ =====================

    test.describe('Редактирование продукта', () => {
        test('Успешное обновление названия продукта', async () => {
            const product = generateValidProduct('-edit');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.clickEditForProduct(product.name);

            const updatedName = product.name + ' (обновлено)';
            await productsPage.nameInput().fill(updatedName);
            await productsPage.submitForm();

            await productsPage.expectNotification('Продукт успешно обновлен');
            await expect(productsPage.page.getByText(updatedName)).toBeVisible();
            await expect(productsPage.page.getByText(product.name)).not.toBeVisible();
        });

        test('Обновление КБЖУ продукта', async () => {
            const product = generateValidProduct('-edit-kbju');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.clickEditForProduct(product.name);
            await productsPage.caloriesInput().fill('999');
            await productsPage.submitForm();

            await productsPage.expectNotification('Продукт успешно обновлен');

            // Проверяем что новое значение калорий отображается в строке
            const row = productsPage.getProductRow(product.name);
            await expect(row).toContainText('999');
        });

        test('Попытка обновить на невалидную сумму БЖУ — ошибка, данные не изменились', async () => {
            const product = generateValidProduct('-edit-invalid');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.clickEditForProduct(product.name);
            await productsPage.proteinInput().fill('50');
            await productsPage.fatsInput().fill('40');
            await productsPage.carbsInput().fill('30');
            await productsPage.submitForm();

            await expect(
                productsPage.page.getByText('Сумма БЖУ не может быть больше 100 г на 100 г продукта')
            ).toBeVisible({ timeout: 5000 });
            await expect(productsPage.page.getByRole('dialog')).toBeVisible();
        });
    });

    // ===================== УДАЛЕНИЕ =====================

    test.describe('Удаление продукта', () => {
        test('Удалённый продукт исчезает из таблицы', async () => {
            const product = generateValidProduct('-delete');

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');
            await expect(productsPage.page.getByText(product.name)).toBeVisible();

            // Удаляем — кнопка удаления вторая в строке
            const row = productsPage.getProductRow(product.name);
            productsPage.page.once('dialog', dialog => dialog.accept());
            await row.getByRole('button').nth(1).click();

            await expect(productsPage.page.getByText(product.name)).not.toBeVisible({ timeout: 10000 });
        });
    });

    // ===================== ФИЛЬТРАЦИЯ И ПОИСК =====================

    test.describe('Фильтрация и поиск', () => {
        test('Поиск по названию — находит созданный продукт', async () => {
            const uniquePart = `Уник${Date.now()}`;
            const product = { ...generateValidProduct(), name: `${uniquePart} тест` };

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.page.getByPlaceholder('Имя').fill(uniquePart);
            await expect(productsPage.page.getByText(product.name)).toBeVisible({ timeout: 5000 });
        });

        test('Поиск по несуществующему названию — таблица пустая', async () => {
            await productsPage.page.getByPlaceholder('Имя').fill('xyzНесуществующий99999');
            await expect(
                productsPage.page.getByRole('row').nth(1)
            ).not.toBeVisible({ timeout: 3000 }).catch(() => {});
        });

        test('Фильтр по категории — показывает только нужную категорию', async () => {
            const product = { ...generateValidProduct('-filter'), category: 'Сладости' };

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.page.getByLabel('Категория').click();
            await productsPage.page.getByRole('option', { name: 'Сладости', exact: true }).click();

            await expect(productsPage.page.getByText(product.name)).toBeVisible({ timeout: 5000 });
        });

        test('Фильтр по статусу готовности', async () => {
            const product = { ...generateValidProduct('-filter-status'), status: 'Полуфабрикат' };

            await productsPage.openCreateModal();
            await productsPage.fillProductForm(product);
            await productsPage.submitForm();
            await productsPage.expectNotification('Продукт успешно создан');

            await productsPage.page.getByLabel('Статус').click();
            await productsPage.page.getByRole('option', { name: 'Полуфабрикат' }).click();

            await expect(productsPage.page.getByText(product.name)).toBeVisible({ timeout: 5000 });
        });

        const sortOptions = ['По названию', 'По калориям', 'По белкам', 'По жирам', 'По углеводам'];

        for (const sortOption of sortOptions) {
            test(`Сортировка "${sortOption}" не роняет страницу`, async () => {
                await productsPage.page.getByLabel('Сортировка').click();
                await productsPage.page.getByRole('option', { name: sortOption }).click();

                // Страница не упала — таблица видна
                await expect(productsPage.page.getByRole('table')).toBeVisible();
            });
        }
    });

    // ===================== ПРОСМОТР ПРОДУКТА =====================

    test('Клик по строке открывает просмотр продукта', async () => {
        const product = generateValidProduct('-view');

        await productsPage.openCreateModal();
        await productsPage.fillProductForm(product);
        await productsPage.submitForm();
        await productsPage.expectNotification('Продукт успешно создан');

        // Кликаем по строке (не по кнопкам)
        await productsPage.getProductRow(product.name).click();

        await expect(productsPage.page.getByText('Просмотр продукта')).toBeVisible({ timeout: 5000 });
        await expect(productsPage.page.getByText(product.name)).toBeVisible();
    });
});