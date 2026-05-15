package com.example.AppTesting.controllers;

import com.example.AppTesting.AppTestingApplication;
import com.example.AppTesting.Helper;
import com.example.AppTesting.dtos.requests.DishDto;
import com.example.AppTesting.dtos.requests.DishIngredientDto;
import com.example.AppTesting.models.enums.DishCategory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(classes = AppTestingApplication.class)
@AutoConfigureMockMvc
@ImportAutoConfiguration(JacksonAutoConfiguration.class)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Интеграционные тесты DishController")
public class DishControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    private ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private Helper utils;

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("apptesting_test")
            .withUsername("postgres")
            .withPassword("postgres");
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    @BeforeEach
    @Sql("/cleanup.sql")
    void setUp() {
        utils = new Helper(mockMvc, mapper);
    }

    // ===================== CREATE =====================

    @Nested
    @DisplayName("Создание блюда")
    class Create {
        @Nested
        @DisplayName("Валидные данные")
        class Valid {
            @ParameterizedTest(name = "CREATE - Макрос {0} в названии (кат. {1})")
            @CsvSource({
                    "!первое, FIRST",
                    "!второе, SECOND",
                    "!напиток, DRINK",
                    "!салат, SALAD",
                    "!суп, SOUP",
                    "!перекус, SNACK"
            })
            void createDish_AllMacros(String macro, String expectedCategory) throws Exception {
                Long pid = utils.createProductAndGetId("Ингредиент " + macro);
                DishDto dto = utils.buildDish(
                        macro + " Блюдо",
                        300f,
                        null,
                        new DishIngredientDto(pid, 100f)
                );

                mockMvc.perform(post("/api/dishes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(dto)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.category").value(expectedCategory))
                        .andExpect(jsonPath("$.name").value("Блюдо"));
            }

            @ParameterizedTest(name = "Количество {0} г, КБЖУ - {1}/{2}/{3}/{4}")
            @CsvSource({
                    "0, 0.0, 0.0, 0.0, 0.0",
                    "0.01, 0.025, 0.002, 0.0015, 0.003",
                    "100, 250.0, 20.0, 15.0, 30.0",
                    "1000, 2500.0, 200.0, 150.0, 300.0"
            })
            void createDish_BoundaryQuantity(float qty, float expectedCal, float p, float f, float c) throws Exception {
                Long pid = utils.createProductAndGetId("Масло_" + qty);
                DishDto dto = utils.buildDish(
                        "Тест_qty_" + qty,
                        300f,
                        DishCategory.SECOND,
                        new DishIngredientDto(pid, qty)
                );

                mockMvc.perform(post("/api/dishes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(dto)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.calories").value(closeTo(expectedCal, 0.5)))
                        .andExpect(jsonPath("$.protein").value(closeTo(p, 0.5)))
                        .andExpect(jsonPath("$.fats").value(closeTo(f, 0.5)))
                        .andExpect(jsonPath("$.carbs").value(closeTo(c, 0.5)));
            }
        }

        @Nested
        @DisplayName("Невалидные данные")
        class Invalid {
            @Test
            @DisplayName("CREATE - Нет категории и макроса -> 400")
            void createDish_NoCategoryNoMacro_Returns400() throws Exception {
                Long pid = utils.createProductAndGetId("Продукт");
                DishDto dto = utils.buildDish(
                        "Без категории",
                        300f,
                        null,
                        new DishIngredientDto(pid, 100f)
                );

                mockMvc.perform(post("/api/dishes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(dto)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("CREATE - Пустой список ингредиентов -> 400")
            void createDish_EmptyIngredients_Returns400() throws Exception {
                DishDto dto = utils.buildDishWithIngredients(
                        "Пустое",
                        300f,
                        DishCategory.SECOND,
                        List.of()
                );
                mockMvc.perform(post("/api/dishes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(dto)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("CREATE - отрицательное количество продукта -> 400")
            void createDish_NegativeProductQuantity_Returns400() throws Exception {
                Long pid = utils.createProductAndGetId("Продукт");
                DishDto dto = utils.buildDish(
                        "Тест отриц. кол-во",
                        300f,
                        DishCategory.SECOND,
                        new DishIngredientDto(pid, -0.01f)
                );

                mockMvc.perform(post("/api/dishes")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(dto)))
                        .andExpect(status().isBadRequest());
            }
        }
    }

    // ===================== GET =====================

    @Nested
    @DisplayName("Получение блюда")
    class Get {
        @Test
        @DisplayName("GET /{id} - существующий")
        void getDish_Exists() throws Exception {
            Long pid = utils.createProductAndGetId("Рис");
            Long dishId = utils.createSimpleDish(pid, "Каша", 250f, 150f);

            mockMvc.perform(get("/api/dishes/{id}", dishId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(dishId))
                    .andExpect(jsonPath("$.name").value("Каша"));
        }
        @Nested
        @DisplayName("Получение списка блюд с фильтрами")
        class GetFilteredList {

            @Test
            @DisplayName("GET /dishes — фильтрация по категории")
            void getDishes_FilterByCategory_ReturnsMatching() throws Exception {
                Long pid = utils.createProductAndGetId("Курица");
                utils.createSimpleDish(pid, "Куриный суп", 400f, 300f);
                utils.createSimpleDish(pid, "Салат Цезарь", 250f, 200f);

                mockMvc.perform(get("/api/dishes")
                                .param("category", "SECOND"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)));
            }

            @Test
            @DisplayName("GET /dishes — поиск по названию")
            void getDishes_SearchByName_ReturnsMatching() throws Exception {
                Long pid = utils.createProductAndGetId("Рис");
                utils.createSimpleDish(pid, "Плов узбекский", 500f, 400f);

                mockMvc.perform(get("/api/dishes")
                                .param("search", "плов"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].name").value(containsStringIgnoringCase("Плов")));
            }

            @ParameterizedTest
            @DisplayName("GET /dishes — сортировка по полям")
            @CsvSource({"calories", "protein", "name", "portionSize"})
            void getDishes_SortByField_Returns200(String sortBy) throws Exception {
                mockMvc.perform(get("/api/dishes")
                                .param("sortBy", sortBy))
                        .andExpect(status().isOk());
            }
        }
        @Test
        @DisplayName("GET /{id} - несуществующий -> 404")
        void getDish_NotFound() throws Exception {
            mockMvc.perform(get("/api/dishes/{id}", 999999L))
                    .andExpect(status().isNotFound());
        }
    }

    // ===================== UPDATE =====================

    @Nested
    @DisplayName("Обновление блюда")
    class Update {
        @Nested
        @DisplayName("Валидные данные")
        class Valid {
            @Test
            @DisplayName("UPDATE /{id} - пересчёт КБЖУ и порции")
            void updateDish_ValidData_Returns200() throws Exception {
                Long pid = utils.createProductAndGetId("Курица");
                Long dishId = utils.createSimpleDish(pid, "Старое", 300f, 150f);

                DishDto update = utils.buildDish("Новое", 500f, DishCategory.SECOND,
                        new DishIngredientDto(pid, 400f));

                mockMvc.perform(put("/api/dishes/{id}", dishId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(update)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.name").value("Новое"))
                        .andExpect(jsonPath("$.portionSize").value(500.0));
            }
        }
        @Nested
        @DisplayName("Невалидные данные")
        class Invalid {
            @Test
            @DisplayName("UPDATE — пустой список ингредиентов -> 400")
            void updateDish_EmptyIngredients_Returns400() throws Exception {
                Long pid = utils.createProductAndGetId("Рис");
                Long dishId = utils.createSimpleDish(pid, "Старое блюдо", 300f, 100f);

                DishDto invalid = utils.buildDishWithIngredients(
                        "Обновлённое",
                        400f,
                        DishCategory.SECOND,
                        List.of()
                );

                mockMvc.perform(put("/api/dishes/{id}", dishId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(invalid)))
                        .andExpect(status().isBadRequest());
            }
            @Test
            @DisplayName("UPDATE — отрицательное количество ингредиента -> 400")
            void updateDish_NegativeQuantity_Returns400() throws Exception {
                Long pid = utils.createProductAndGetId("Курица");
                Long dishId = utils.createSimpleDish(pid, "Старое", 300f, 150f);

                DishDto invalid = utils.buildDish(
                        "Новое",
                        400f,
                        DishCategory.SECOND,
                        new DishIngredientDto(pid, -50f)
                );

                mockMvc.perform(put("/api/dishes/{id}", dishId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(invalid)))
                        .andExpect(status().isBadRequest());
            }
            @Test
            @DisplayName("UPDATE — отсутствие категории и макроса в названии -> 400")
            void updateDish_NoCategoryNoMacro_Returns400() throws Exception {
                Long pid = utils.createProductAndGetId("Продукт");
                Long dishId = utils.createSimpleDish(pid, "Старое", 300f, 100f);

                DishDto invalid = utils.buildDish(
                        "Просто название без макроса",
                        300f,
                        null,
                        new DishIngredientDto(pid, 100f)
                );

                mockMvc.perform(put("/api/dishes/{id}", dishId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(invalid)))
                        .andExpect(status().isBadRequest());
            }
        }
        @Test
        @DisplayName("UPDATE /{id} - несуществующий id -> 404")
        void updateDish_NotFound_Returns404() throws Exception {
            Long pid = utils.createProductAndGetId("Какой-то продукт");
            DishDto dto = utils.buildDish(
                    "Блюдо",
                    300f,
                    DishCategory.SECOND,
                    new DishIngredientDto(pid, 100f)
            );
            mockMvc.perform(put("/api/dishes/{id}", 999999L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(dto)))
                    .andExpect(status().isNotFound());
        }
    }

    // ===================== DELETE =====================

    @Nested
    @DisplayName("Удаление блюда")
    class Delete {
        @Test
        @DisplayName("DELETE /{id} - существующее блюдо -> 200 ОК")
        void deleteDish_Exists_Returns200() throws Exception {
            Long pid = utils.createProductAndGetId("Продукт");
            Long dishId = utils.createSimpleDish(pid, "На удаление", 300f, 100f);

            mockMvc.perform(delete("/api/dishes/{id}", dishId))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/dishes/{id}", dishId))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("DELETE /{id} - несуществующее блюдо -> 200 ОК (идемпотентное удаление)")
        void deleteDish_NotExists_Returns200() throws Exception {
            mockMvc.perform(delete("/api/dishes/{id}", 999999L))
                    .andExpect(status().isOk());
        }
    }
}
