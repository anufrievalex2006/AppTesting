package com.example.AppTesting.services;

import com.example.AppTesting.dtos.responses.NutritionInfoResponse;
import com.example.AppTesting.models.api.DishIngredient;
import com.example.AppTesting.models.api.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Юнит-тесты для метода calculateNutrition из DishService.
 * Применяются:
 * - Эквивалентное разбиение (пустой список, один ингредиент, несколько ингредиентов)
 * - Анализ граничных значений (количество = 0, дробные значения, большие числа)
 */
@DisplayName("Автоматический расчёт КБЖУ блюда")
class DishServiceTest {

    private DishService dishService;

    @BeforeEach
    void setUp() {
        dishService = new DishService(null, null);
    }

    @Test
    @DisplayName("Пустой список ингредиентов -> все значения 0")
    void calculateNutrition_EmptyIngredients_ReturnsAllZeros() {
        NutritionInfoResponse result = dishService.calculateNutrition(Collections.emptyList());

        assertEquals(0f, result.getCalories(), 0.001);
        assertEquals(0f, result.getProtein(), 0.001);
        assertEquals(0f, result.getFats(), 0.001);
        assertEquals(0f, result.getCarbs(), 0.001);
    }

    @Nested
    @DisplayName("Один ингредиент")
    class SingleIngredient {

        @Test
        @DisplayName("Продукт с нормальными значениями, количество 100 г: КБЖУ = 100% от значений продукта")
        void singleIngredient_100g_ReturnsExactProductValues() {
            Product product = createProduct(250, 20, 15, 30);
            DishIngredient ingredient = createIngredient(product, 100);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertEquals(250, result.getCalories(), 0.001);
            assertEquals(20, result.getProtein(), 0.001);
            assertEquals(15, result.getFats(), 0.001);
            assertEquals(30, result.getCarbs(), 0.001);
        }

        @ParameterizedTest(name = "Количество {0} г: калории {1}, белки {2}, жиры {3}, углеводы {4}")
        @CsvSource({
                "150, 375.0, 30.0, 22.5, 45.0",
                "0,   0.0,   0.0,  0.0,  0.0",
                "50,  125.0, 10.0,  7.5, 15.0"
        })
        @DisplayName("Разное количество продукта с КБЖУ 250/20/15/30")
        void singleIngredient_VariousQuantities_ReturnsScaledValues(float quantity,
                                                                    float expectedCal,
                                                                    float expectedProt,
                                                                    float expectedFats,
                                                                    float expectedCarbs) {
            Product product = createProduct(250, 20, 15, 30);
            DishIngredient ingredient = createIngredient(product, quantity);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertEquals(expectedCal, result.getCalories(), 0.001);
            assertEquals(expectedProt, result.getProtein(), 0.001);
            assertEquals(expectedFats, result.getFats(), 0.001);
            assertEquals(expectedCarbs, result.getCarbs(), 0.001);
        }
    }

    @Test
    @DisplayName("Два ингредиента - корректное суммирование КБЖУ")
    void multipleIngredients_SumsCorrectly() {
        Product prod1 = createProduct(100, 10, 5, 20);
        Product prod2 = createProduct(200, 25, 15, 30);
        DishIngredient ing1 = createIngredient(prod1, 150);
        DishIngredient ing2 = createIngredient(prod2, 50);

        NutritionInfoResponse result = dishService.calculateNutrition(List.of(ing1, ing2));

        // prod1: 100*1.5=150, 10*1.5=15, 5*1.5=7.5, 20*1.5=30
        // prod2: 200*0.5=100, 25*0.5=12.5, 15*0.5=7.5, 30*0.5=15
        assertEquals(250, result.getCalories(), 0.001);
        assertEquals(27.5, result.getProtein(), 0.001);
        assertEquals(15, result.getFats(), 0.001);
        assertEquals(45, result.getCarbs(), 0.001);
    }

    @Nested
    @DisplayName("Проверка граничных значений")
    class BoundaryValues {

        @Test
        @DisplayName("Количество = 0 г -> нулевое КБЖУ")
        void zeroQuantity_ReturnsAllZeros() {
            Product product = createProduct(300, 30, 20, 40);
            DishIngredient ingredient = createIngredient(product, 0);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertAll(
                    () -> assertEquals(0, result.getCalories(), 0.001),
                    () -> assertEquals(0, result.getProtein(), 0.001),
                    () -> assertEquals(0, result.getFats(), 0.001),
                    () -> assertEquals(0, result.getCarbs(), 0.001)
            );
        }

        @Test
        @DisplayName("Продукт с нулевыми КБЖУ (как вода) -> нулевое КБЖУ")
        void productWithZeroNutrients_ReturnsZero() {
            Product water = createProduct(0, 0, 0, 0);
            DishIngredient ingredient = createIngredient(water, 200);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertAll(
                    () -> assertEquals(0, result.getCalories(), 0.001),
                    () -> assertEquals(0, result.getProtein(), 0.001),
                    () -> assertEquals(0, result.getFats(), 0.001),
                    () -> assertEquals(0, result.getCarbs(), 0.001)
            );
        }

        @Test
        @DisplayName("Очень большое количество (10000 г) -> КБЖУ пропорционально увеличиваются")
        void veryLargeQuantity_ScalesCorrectly() {
            Product product = createProduct(300, 30, 20, 40);
            DishIngredient ingredient = createIngredient(product, 10000);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertEquals(30000, result.getCalories(), 0.001);
            assertEquals(3000, result.getProtein(), 0.001);
            assertEquals(2000, result.getFats(), 0.001);
            assertEquals(4000, result.getCarbs(), 0.001);
        }

        @ParameterizedTest(name = "Дробное количество {0} г")
        @CsvSource({
                "0.1,  0.25, 0.02, 0.015, 0.03",
                "0.01, 0.025, 0.002, 0.0015, 0.003"
        })
        @DisplayName("Очень маленькое количество продукта")
        void tinyQuantity_ReturnsCorrectValues(float qty, float cal, float prot, float fats, float carbs) {
            Product product = createProduct(250, 20, 15, 30);
            DishIngredient ingredient = createIngredient(product, qty);

            NutritionInfoResponse result = dishService.calculateNutrition(List.of(ingredient));

            assertEquals(cal, result.getCalories(), 0.001);
            assertEquals(prot, result.getProtein(), 0.001);
            assertEquals(fats, result.getFats(), 0.001);
            assertEquals(carbs, result.getCarbs(), 0.001);
        }
    }

    @Test
    @DisplayName("Ингредиент без продукта (product == null) игнорируется")
    void ingredientWithNullProduct_IsSkipped() {
        DishIngredient broken = new DishIngredient();
        broken.setProduct(null);
        broken.setQuantity(100);
        Product normal = createProduct(100, 10, 5, 20);
        DishIngredient ok = createIngredient(normal, 100);

        NutritionInfoResponse result = dishService.calculateNutrition(List.of(broken, ok));

        // Только от второго ингредиента
        assertEquals(100, result.getCalories(), 0.001);
        assertEquals(10, result.getProtein(), 0.001);
        assertEquals(5, result.getFats(), 0.001);
        assertEquals(20, result.getCarbs(), 0.001);
    }

    private Product createProduct(float cals, float prot, float fats, float carbs) {
        Product p = new Product();
        p.setCalories(cals);
        p.setProtein(prot);
        p.setFats(fats);
        p.setCarbs(carbs);
        return p;
    }

    private DishIngredient createIngredient(Product product, float quantity) {
        DishIngredient di = new DishIngredient();
        di.setProduct(product);
        di.setQuantity(quantity);
        return di;
    }
}