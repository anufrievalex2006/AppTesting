package com.example.AppTesting.controllers;

import com.example.AppTesting.AppTestingApplication;
import com.example.AppTesting.Helper;
import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.*;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(classes = AppTestingApplication.class)
@AutoConfigureMockMvc
@ImportAutoConfiguration(JacksonAutoConfiguration.class)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Интеграционные тесты ProductController")
class ProductControllerIntegrationTest {

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
    @DisplayName("Создание продукта")
    class Create {
        @Nested
        @DisplayName("Валидные данные")
        class Valid {
            @Test
            @Order(1)
            @DisplayName("CREATE — Happy Path: продукт сохраняется и возвращается с id")
            void createProduct_ValidData_Returns200WithId() throws Exception {
                Product p = utils.createValidProduct("Куриная грудка");

                mockMvc.perform(post("/api/products")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(p)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.name").value("Куриная грудка"))
                        .andExpect(jsonPath("$.id").exists())
                        .andExpect(jsonPath("$.calories").value(250.0));
            }

            @ParameterizedTest(name = "КБЖУ: {0} / {1} / {2} / {3}")
            @DisplayName("CREATE — Граничные значения КБЖУ -> 200 OK")
            @CsvSource({
                    "0,    0,    0,    0",
                    "0.01, 0.01, 0.01, 0.01",
                    "100,  25,   5,    3",
                    "500,  50,   30,   20",
                    "999,  33,   33,   34"
            })
            void createProduct_BoundaryNutrition_Returns200(float cal, float prot, float fat, float carb) throws Exception {
                Product p = utils.createProduct("Граничный продукт", cal, prot, fat, carb);

                mockMvc.perform(post("/api/products")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(p)))
                        .andExpect(status().isOk());
            }
        }
        @Nested
        @DisplayName("Невалидные данные")
        class Invalid {
            @Test
            @DisplayName("CREATE — Сумма БЖУ (40/40/30) > 100 -> 400 Bad Request")
            void createProduct_BJUSumExceedsLimit_Returns400() throws Exception {
                Product p = utils.createInvalidBJUProduct();

                mockMvc.perform(post("/api/products")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(p)))
                        .andExpect(status().isBadRequest());
            }

            @ParameterizedTest(name = "Отрицательное поле КБЖУ: {0} / {1} / {2} / {3}")
            @DisplayName("CREATE — Отрицательные КБЖУ -> 400")
            @CsvSource({
                    "-0.01, 10,    5,    20",
                    "100,  -0.01,  5,    20",
                    "100,   10,   -0.01, 20",
                    "100,   10,    5,   -0.01"
            })
            void createProduct_NegativeNutrition_Returns400(float cal, float prot, float fat, float carb) throws Exception {
                Product p = utils.createProduct("Невалидный продукт", cal, prot, fat, carb);

                mockMvc.perform(post("/api/products")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(p)))
                        .andExpect(status().isBadRequest());
            }
        }
    }

    // ===================== GET =====================

    @Nested
    @DisplayName("Получение продукта")
    class Get {
        @Test
        @DisplayName("GET /{id} — существующий продукт -> 200")
        void getProductById_Exists_Returns200() throws Exception {
            Long id = utils.createProductAndGetId("Для чтения");

            mockMvc.perform(get("/api/products/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(id))
                    .andExpect(jsonPath("$.name").value("Для чтения"));
        }
        @Test
        @DisplayName("GET — фильтрация по category, flags и search")
        void getProducts_AllFilters_ReturnsMatchingResults() throws Exception {
            Product p = utils.createValidProduct("Салатик");

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(p)))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/products")
                            .param("category", "VEGETABLES")
                            .param("flags", "VEGAN")
                            .param("search", "салат"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)))
                    .andExpect(jsonPath("$[0].name").value(containsStringIgnoringCase("салат")))
                    .andExpect(jsonPath("$[0].category").value("VEGETABLES"));
        }

        @Test
        @DisplayName("GET — фильтр по несуществующей категории -> пустой список")
        void getProducts_FilterByUnusedCategory_ReturnsEmpty() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("category", "SWEETS")
                            .param("search", "xyzNotExist12345"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @ParameterizedTest(name = "Сортировка по: {0}")
        @DisplayName("GET — сортировка по всем допустимым полям -> 200 OK")
        @CsvSource({"calories", "protein", "fats", "carbs", "name"})
        void getProducts_SortByAllFields_Returns200(String sortBy) throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("sortBy", sortBy))
                    .andExpect(status().isOk());
        }
        @Test
        @DisplayName("GET /{id} — несуществующий -> 404")
        void getProductById_NotFound_Returns404() throws Exception {
            mockMvc.perform(get("/api/products/{id}", 999999L))
                    .andExpect(status().isNotFound());
        }
    }

    // ===================== UPDATE =====================

    @Nested
    @DisplayName("Обновление продукта")
    class Update {
        @Test
        @DisplayName("UPDATE /{id} — успешное обновление")
        void updateProduct_ValidData_Returns200WithUpdatedFields() throws Exception {
            Long id = utils.createProductAndGetId("Старое название");

            Product updated = utils.createProduct("Новое название", 300, 30, 10, 40);

            mockMvc.perform(put("/api/products/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(updated)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Новое название"))
                    .andExpect(jsonPath("$.calories").value(300.0));
        }

        @Test
        @DisplayName("UPDATE /{id} - обновление на продукт с суммой БЖУ > 100 -> 400")
        void updateProduct_InvalidData_BJUMore100_Returns400() throws Exception {
            Long id = utils.createProductAndGetId("Старое название");

            Product updated = utils.createProduct("Новое название", 300, 30, 90, 40);

            mockMvc.perform(put("/api/products/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(updated)))
                    .andExpect(status().isBadRequest());
        }

        @ParameterizedTest(name = "Отрицательное поле КБЖУ: {0} / {1} / {2} / {3}")
        @DisplayName("UPDATE /{id} - обновление на продукт с отрицательными КБЖУ -> 400")
        @CsvSource({
                "-0.01, 10,    5,    20",
                "100,  -0.01,  5,    20",
                "100,   10,   -0.01, 20",
                "100,   10,    5,   -0.01"
        })
        void updateProduct_InvalidData_NegativeKBJU_Returns400(float cal, float prot, float fat, float carb) throws Exception {
            Long id = utils.createProductAndGetId("Старое название");
            Product updated = utils.createProduct("Новое название", cal, prot, fat, carb);
            mockMvc.perform(put("/api/products/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(updated)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("UPDATE /{id} — несуществующий id -> 404")
        void updateProduct_NotFound_Returns404() throws Exception {
            Product p = utils.createValidProduct("Несуществующий");

            mockMvc.perform(put("/api/products/{id}", 999999L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(p)))
                    .andExpect(status().isNotFound());
        }
    }

    // ===================== DELETE =====================

    @Nested
    @DisplayName("Удаление продукта")
    class Delete {
        @Test
        @DisplayName("DELETE /{id} — неиспользуемый продукт -> 200 OK")
        void deleteProduct_NotUsedInDishes_Returns200() throws Exception {
            Long id = utils.createProductAndGetId("Продукт на удаление");

            mockMvc.perform(delete("/api/products/{id}", id))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/products/{id}", id))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("DELETE /{id} - используемый продукт -> 409 Conflict")
        void deleteProduct_UsedInDish_Returns409() throws Exception {
            Long pid = utils.createProductAndGetId("Используемый продукт");
            utils.createSimpleDish(pid, "Блюдо с этим продуктом", 300f, 150f);

            mockMvc.perform(delete("/api/products/{id}", pid))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("DELETE /{id} — несуществующий id -> 200 ОК (идемпотентное удаление)")
        void deleteProduct_NotFound_Returns200() throws Exception {
            mockMvc.perform(delete("/api/products/{id}", 999999L))
                    .andExpect(status().isOk());
        }
    }
}