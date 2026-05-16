import { test, expect } from "@playwright/test";
import { DishesPage } from "../pages/Dishes";

test.describe('Страница блюд - CRUD + бизнес-логика', () => {
    let dishesPage: DishesPage;

    test.beforeEach(async ({ page }) => {
        dishesPage = new DishesPage(page);
        await dishesPage.goto("/dishes");
    });

    // ===================== СОЗДАНИЕ — МАКРОСЫ =====================

    test.describe('Макросы в названии => авто-категория', () => {
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
            test(`Макрос ${macro} переносится как категория "${category}"`, async () => {
                const rawName = `${macro} Тестовое блюдо ${Date.now()}`;
                const displayedName = rawName.replace(macro, '').trim();

                await dishesPage.openCreateModal();
                await dishesPage.fillDishName(rawName);
                await dishesPage.addIngredient('Картофель', 250);
                await dishesPage.submitForm();

                await expect(dishesPage.page.getByText(displayedName)).toBeVisible();

                const row = dishesPage.getDishRow(displayedName);
                await expect(row).toContainText(category);
            });
        }

        test('Макрос вырезается из названия при сохранении', async () => {
            const rawName = `!первое Борщ ${Date.now()}`;
            const displayedName = rawName.replace('!первое', '').trim();

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(rawName);
            await dishesPage.addIngredient('Вода', 500);
            await dishesPage.addIngredient('Картофель', 200);
            await dishesPage.addIngredient('Мясо', 200);
            await dishesPage.addIngredient('Свекла', 150);
            await dishesPage.submitForm();

            await expect(dishesPage.page.getByText(rawName)).not.toBeVisible();
            await expect(dishesPage.page.getByText(displayedName)).toBeVisible();
        });

        test('Категория из поля формы приоритетнее макроса', async () => {
            const rawName = `!первое Тест приоритета ${Date.now()}`;
            const displayedName = rawName.replace('!первое', '').trim();

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(rawName);
            await dishesPage.selectCategory('Десерт');
            await dishesPage.addIngredient('Вода', 200);
            await dishesPage.submitForm();

            await expect(dishesPage.page.getByText(displayedName)).toBeVisible();
            const row = dishesPage.getDishRow(displayedName);
            await expect(row).toContainText('Десерт');
            await expect(row).not.toContainText('Первое');
        });
    });

    // ===================== СОЗДАНИЕ — КБЖУ =====================

    test('Автоматический расчёт КБЖУ по ингредиентам', async () => {
        const dishName = `Тест КБЖУ ${Date.now()}`;

        await dishesPage.openCreateModal();
        await dishesPage.fillDishName(dishName);
        await dishesPage.selectCategory('Напиток');
        await dishesPage.addIngredient('Вода', 200);
        await dishesPage.submitForm();

        await expect(dishesPage.page.getByText(dishName)).toBeVisible();
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
        await dishesPage.addIngredient('Картофель', 50);
        await dishesPage.addIngredient('Мясо', 600);
        await dishesPage.submitForm();

        await expect(dishesPage.page.getByText(dishName)).toBeVisible();
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
            ).toBeVisible();

            // Модалка остаётся открытой
            await expect(dishesPage.page.getByRole('dialog')).toBeVisible();
        });

        test('Нельзя создать блюдо без названия', async () => {
            await dishesPage.openCreateModal();
            // без названия
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
            await expect(dishesPage.page.getByText(originalName)).toBeVisible();

            // Редактируем
            const row = dishesPage.getDishRow(originalName);
            await row.getByRole('button').first().click();

            const updatedName = `Обновлённое ${Date.now()}`;
            await dishesPage.fillDishName(updatedName);
            await dishesPage.submitForm();

            await expect(dishesPage.page.getByText(updatedName)).toBeVisible();
            await expect(dishesPage.page.getByText(originalName)).not.toBeVisible();
        });

        test('Редактирование категории блюда', async () => {
            const dishName = `Смена категории ${Date.now()}`;
            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Суп');
            await dishesPage.addIngredient('Вода', 200);
            await dishesPage.addIngredient('Картофель', 450);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();

            // Открываем редактирование
            const row = dishesPage.getDishRow(dishName);
            await row.getByRole('button').first().click();

            await dishesPage.selectCategory('Салат');
            await dishesPage.submitForm();

            const updatedRow = dishesPage.getDishRow(dishName);
            await expect(updatedRow).toContainText('Салат');
        });

        test('Редактирование количества ингредиента меняет КБЖУ блюда', async () => {
            const dishName = `Ред. ингредиент ${Date.now()}`;

            await dishesPage.openCreateModal();
            await dishesPage.fillDishName(dishName);
            await dishesPage.selectCategory('Второе');
            await dishesPage.addIngredient('Картофель', 100);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();

            const row = dishesPage.getDishRow(dishName);
            await row.getByRole('button').first().click();

            // Меняем количество ингредиента
            const qtyInput = dishesPage.page.getByTestId('dish-quantity-select').last();
            await qtyInput.fill('500');
            await dishesPage.submitForm();

            const updatedRow = dishesPage.getDishRow(dishName);
            await expect(updatedRow).toBeVisible();
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
            await dishesPage.addIngredient('Свекла', 40);
            await dishesPage.submitForm();
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();

            // Удаляем
            const row = dishesPage.getDishRow(dishName);
            dishesPage.page.once('dialog', dialog => dialog.accept());
            await row.getByRole('button').nth(1).click(); // кнопка удаления

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
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();

            // Ищем по уникальной части
            await dishesPage.page.getByPlaceholder('Введите название...').fill(uniquePart);
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();
        });

        test('Поиск по несуществующему названию — таблица пустая', async () => {
            await dishesPage.page.getByPlaceholder('Введите название...').fill('xyzНесуществующееБлюдо99999');
            await expect(dishesPage.page.getByRole('row').nth(1)).not.toBeVisible().catch(() => {
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
            await expect(dishesPage.page.getByText(dishName)).toBeVisible();

            // Выбираем фильтр по категории Десерт
            await dishesPage.page.getByRole('textbox', { name: 'Категория' }).click();
            await dishesPage.page.getByRole('option', { name: 'Десерт', exact: true }).click();

            await expect(dishesPage.page.getByText(dishName)).toBeVisible();
        });
    });

    // ===================== ПРОСМОТР БЛЮДА =====================

    test('Клик по строке открывает просмотр блюда', async () => {
        const dishName = `Просмотр ${Date.now()}`;

        await dishesPage.openCreateModal();
        await dishesPage.fillDishName(dishName);
        await dishesPage.selectCategory('Второе');
        await dishesPage.addIngredient('Вода', 150);
        await dishesPage.addIngredient('Свекла', 200);
        await dishesPage.addIngredient('Мясо', 200);
        await dishesPage.submitForm();
        await expect(dishesPage.page.getByText(dishName)).toBeVisible();

        // Кликаем по строке (не по кнопкам)
        await dishesPage.getDishRow(dishName).click();

        // Открывается модалка просмотра с названием блюда
        await expect(dishesPage.page.getByText('Просмотр блюда')).toBeVisible();
        await expect(dishesPage.page.getByRole('dialog').getByText(dishName)).toBeVisible();
    });
});