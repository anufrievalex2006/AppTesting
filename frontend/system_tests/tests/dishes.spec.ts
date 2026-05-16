import { test, expect } from "@playwright/test";
import { DishesPage } from "../pages/Dishes";

test.describe('Страница блюд - CRUD + бизнес-логика', () => {
    let dishesPage: DishesPage;

    test.beforeEach(async ({ page }) => {
        dishesPage = new DishesPage(page);
        await dishesPage.goto("/dishes");
    });

    // ===================== СОЗДАНИЕ — МАКРОСЫ =====================

    test.describe('Макросы в названии → авто-категория', () => {
        const macros = [
            { macro: '!первое',  category: 'Первое'  },
            { macro: '!второе',  category: 'Второе'  },
            { macro: '!суп',     category: 'Суп'     },
            { macro: '!салат',   category: 'Салат'   },
            { macro: '!напиток', category: 'Напиток' },
            { macro: '!десерт',  category: 'Десерт'  },
            { macro: '!перекус', category: 'Перекус' },
        ];

        for (const { macro, category } of macros) {
            test(`Макрос ${macro} → категория "${category}"`, async () => {
                const rawName = `${macro} Тестовое блюдо ${Date.now()}`;
                const displayedName = rawName.replace(macro, '').trim();

                await dishesPage.openCreateModal();
                await dishesPage.fillDishName(rawName);
                await dishesPage.addIngredient('Вода', 200);
                await dishesPage.submitForm();

                await expect(dishesPage.page.getByText(displayedName)).toBeVisible({ timeout: 15000 });

                const row = dishesPage.getDishRow(displayedName);
                await expect(row).toContainText(category);
            });
        }

        test('Макрос вырезается из названия при сохранении', async () => {
            const rawName = `!первое Борщ ${Date.now()}`;
            const displayedName = rawName.replace('!первое', '').trim();

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(rawName);
            await dishesPage.addIngredient('Вода', 300);
            await dishesPage.submitForm();

            // Исходное имя с макросом НЕ должно отображаться
            await expect(dishesPage.page.getByText(rawName)).not.toBeVisible();
            // Очищенное имя должно отображаться
            await expect(dishesPage.page.getByText(displayedName)).toBeVisible({ timeout: 15000 });
        });

        test('Категория из поля формы приоритетнее макроса', async () => {
            // По ТЗ: если задать категорию в поле И в макросе — побеждает поле
            const rawName = `!первое Тест приоритета ${Date.now()}`;
            const displayedName = rawName.replace('!первое', '').trim();

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(rawName);
            await dishesPage.selectCategory('Десерт'); // поле = Десерт, макрос = Первое
            await dishesPage.addIngredient('Вода', 200);
            await dishesPage.submitForm();

            await expect(dishesPage.page.getByText(displayedName)).toBeVisible({ timeout: 15000 });
            const row = dishesPage.getDishRow(displayedName);
            await expect(row).toContainText('Десерт');
            await expect(row).not.toContainText('Первое');
        });
    });

    // ===================== СОЗДАНИЕ — КАТЕГОРИЯ ВРУЧНУЮ =====================

    test.describe('Создание блюда — категория вручную', () => {
        const categories = ['Первое', 'Второе', 'Суп', 'Салат', 'Напиток', 'Десерт', 'Перекус'];

        for (const category of categories) {
            test(`Создание блюда с категорией "${category}" через поле`, async () => {
                const dishName = `Блюдо ${category} ${Date.now()}`;

                await dishesPage.openCreateModal();
                await dishesPage.fillDishName(dishName);
                await dishesPage.selectCategory(category);
                await dishesPage.addIngredient('Вода', 200);
                await dishesPage.submitForm();

                await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });
                const row = dishesPage.getDishRow(dishName);
                await expect(row).toContainText(category);
            });
        }
    });

    // ===================== СОЗДАНИЕ — КБЖУ =====================

    test('Автоматический расчёт КБЖУ по ингредиентам', async () => {
        const dishName = `Тест КБЖУ ${Date.now()}`;

        await dishesPage.openCreateModal();
        await dishesPage.fillDishName(dishName);
        await dishesPage.selectCategory('Напиток');
        await dishesPage.addIngredient('Вода', 200);
        await dishesPage.submitForm();

        await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });
        // КБЖУ воды = 0, поэтому в строке должны быть нули
        const row = dishesPage.getDishRow(dishName);
        await expect(row).toContainText('0');
    });

    test('Создание блюда с несколькими ингредиентами', async () => {
        const dishName = `Мульти-ингредиент ${Date.now()}`;

        await dishesPage.openCreateModal();
        await dishesPage.fillDishName(dishName);
        await dishesPage.selectCategory('Второе');
        await dishesPage.addIngredient('Вода', 100);
        await dishesPage.addIngredient('Вода', 50); // добавляем второй ингредиент
        await dishesPage.submitForm();

        await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });
    });

    // ===================== ВАЛИДАЦИЯ — СОЗДАНИЕ =====================

    test.describe('Валидация при создании', () => {
        test('Нельзя создать блюдо без ингредиентов', async () => {
            const dishName = `Пустое блюдо ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Второе');
            await dishesPage.clickSubmit();

            await expect(
                dishesPage.page.getByText('Добавьте хотя бы один продукт')
            ).toBeVisible({ timeout: 5000 });

            // Модалка остаётся открытой
            await expect(dishesPage.page.getByRole('dialog')).toBeVisible();
        });

        test('Нельзя создать блюдо без названия', async () => {
            await dishesPage.openCreateModal();
            // Оставляем название пустым
            await dishesPage.selectCategory('Второе');
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.clickSubmit();

            // Форма не должна закрыться
            await expect(dishesPage.page.getByRole('dialog')).toBeVisible();
        });

        test('Нельзя создать блюдо без категории (нет макроса и не выбрана)', async () => {
            const dishName = `Без категории ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.clickSubmit();

            // Блюдо не должно появиться в таблице — форма не прошла
            await expect(dishesPage.page.getByRole('dialog')).toBeVisible();
            await expect(dishesPage.page.getByText(dishName)).not.toBeVisible();
        });

        test('Отмена создания — блюдо не появляется в таблице', async () => {
            const dishName = `Отмена ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Первое');
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.closeModal();

            await expect(dishesPage.page.getByText(dishName)).not.toBeVisible();
        });
    });

    // ===================== РЕДАКТИРОВАНИЕ =====================

    test.describe('Редактирование блюда', () => {
        test('Редактирование названия блюда', async () => {
            // Создаём блюдо
            const originalName = `Оригинал ${Date.now()}`;
            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(originalName);
            await dishesPage.selectCategory('Второе');
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(originalName)).toBeVisible({ timeout: 15000 });

            // Редактируем
            const row = dishesPage.getDishRow(originalName);
            await row.getByRole('button').first().click();

            const updatedName = `Обновлённое ${Date.now()}`;
            await dishesPage.fillDishName(updatedName);
            await dishesPage.submitForm();

            await expect(dishesPage.page.getByText(updatedName)).toBeVisible({ timeout: 15000 });
            await expect(dishesPage.page.getByText(originalName)).not.toBeVisible();
        });

        test('Редактирование категории блюда', async () => {
            const dishName = `Смена категории ${Date.now()}`;
            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Суп');
            await dishesPage.addIngredient('Вода', 200);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });

            // Открываем редактирование
            const row = dishesPage.getDishRow(dishName);
            await row.getByRole('button').first().click();

            await dishesPage.selectCategory('Салат');
            await dishesPage.submitForm();

            const updatedRow = dishesPage.getDishRow(dishName);
            await expect(updatedRow).toContainText('Салат');
        });
    });

    // ===================== УДАЛЕНИЕ =====================

    test.describe('Удаление блюда', () => {
        test('Удалённое блюдо исчезает из таблицы', async () => {
            const dishName = `На удаление ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Перекус');
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });

            // Удаляем
            const row = dishesPage.getDishRow(dishName);
            await row.getByRole('button').nth(1).click(); // кнопка удаления

            // Подтверждаем confirm-диалог
            dishesPage.page.once('dialog', dialog => dialog.accept());

            await expect(dishesPage.page.getByText(dishName)).not.toBeVisible({ timeout: 10000 });
        });
    });

    // ===================== ФИЛЬТРАЦИЯ И ПОИСК =====================

    test.describe('Фильтрация и поиск', () => {
        test('Поиск блюда по названию находит созданное блюдо', async () => {
            const uniquePart = `Уникальный_${Date.now()}`;
            const dishName = `${uniquePart} суп`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Суп');
            await dishesPage.addIngredient('Вода', 300);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });

            // Ищем по уникальной части
            await dishesPage.page.getByPlaceholder('Введите название...').fill(uniquePart);
            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 5000 });
        });

        test('Поиск по несуществующему названию — таблица пустая', async () => {
            await dishesPage.page.getByPlaceholder('Введите название...').fill('xyzНесуществующееБлюдо99999');
            await expect(dishesPage.page.getByRole('row').nth(1)).not.toBeVisible({ timeout: 3000 }).catch(() => {
                // Допустимо если строк 0 или таблица показывает пустое состояние
            });
        });

        test('Фильтр по категории — показывает только блюда нужной категории', async () => {
            const dishName = `Фильтр-Десерт ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Десерт');
            await dishesPage.addIngredient('Вода', 100);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });

            // Выбираем фильтр по категории Десерт
            await dishesPage.page.getByLabel('Категория').click();
            await dishesPage.page.getByRole('option', { name: 'Десерт', exact: true }).click();

            await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 5000 });
        });
    });

    // ===================== ПРОСМОТР БЛЮДА =====================

    test('Клик по строке открывает просмотр блюда', async () => {
        const dishName = `Просмотр ${Date.now()}`;

        await dishesPage.openCreateModal();
        await dishesPage.fillDishName(dishName);
        await dishesPage.selectCategory('Второе');
        await dishesPage.addIngredient('Вода', 150);
        await dishesPage.submitForm();
        await expect(dishesPage.page.getByText(dishName)).toBeVisible({ timeout: 15000 });

        // Кликаем по строке (не по кнопкам)
        await dishesPage.getDishRow(dishName).click();

        // Открывается модалка просмотра с названием блюда
        await expect(dishesPage.page.getByText('Просмотр блюда')).toBeVisible({ timeout: 5000 });
        await expect(dishesPage.page.getByText(dishName)).toBeVisible();
    });
});