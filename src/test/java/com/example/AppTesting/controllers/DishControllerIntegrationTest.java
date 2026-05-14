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
    void setUp() {
        utils = new Helper(mockMvc, mapper);
    }

    // ===================== CREATE =====================

    @Test
    @Order(1)
    @DisplayName("CREATE — Happy Path: авто-расчёт КБЖУ")
    void createDish_AutoCalculateKBJU() throws Exception {
        Long productId = utils.createProductAndGetId("Рис");

        DishDto dto = utils.buildDish("Плов", 400f, DishCategory.SECOND,
                new DishIngredientDto(productId, 300f));

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Плов"))
                .andExpect(jsonPath("$.calories").isNumber())
                .andExpect(jsonPath("$.protein").isNumber());
    }

    @Test
    @DisplayName("CREATE — Макрос !десерт в названии")
    void createDish_MacroInName() throws Exception {
        Long pid = utils.createProductAndGetId("Творог");

        DishDto dto = utils.buildDish("!десерт Тирамису", 250f, null,
                new DishIngredientDto(pid, 200f));

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("DESSERT"))
                .andExpect(jsonPath("$.name").value("Тирамису"));
    }

    @ParameterizedTest(name = "Макрос {0} → {1}")
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
        DishDto dto = utils.buildDish(macro + " Блюдо", 300f, null,
                new DishIngredientDto(pid, 100f));

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value(expectedCategory));
    }

    @Test
    @DisplayName("CREATE — Нет категории и макроса → 400")
    void createDish_NoCategoryNoMacro() throws Exception {
        Long pid = utils.createProductAndGetId("Продукт");
        DishDto dto = utils.buildDish("Без категории", 300f, null,
                new DishIngredientDto(pid, 100f));

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("CREATE — Пустой список ингредиентов → 400")
    void createDish_EmptyIngredients() throws Exception {
        DishDto dto = new DishDto();
        dto.setName("Пустое");
        dto.setPortionSize(300f);
        dto.setCategory(DishCategory.SECOND);
        dto.setIngredients(List.of());

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest(name = "qty = {0} → calories ≈ {1}")
    @CsvSource({
            "0.01, 0.025",
            "100, 250.0",
            "1000, 2500.0"
    })
    void createDish_BoundaryQuantity(float qty, float expectedCal) throws Exception {
        Long pid = utils.createProductAndGetId("Масло_" + qty);
        DishDto dto = utils.buildDish("Тест_qty", 300f, DishCategory.SECOND,
                new DishIngredientDto(pid, qty));

        mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(closeTo(expectedCal, 0.5)));
    }

    // ===================== GET =====================

    @Test
    @DisplayName("GET /{id} — существующий")
    void getDish_Exists() throws Exception {
        Long pid = utils.createProductAndGetId("Рис");
        Long dishId = utils.createSimpleDish(pid, "Каша", 250f, 150f);

        mockMvc.perform(get("/api/dishes/{id}", dishId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dishId))
                .andExpect(jsonPath("$.name").value("Каша"));
    }

    @Test
    @DisplayName("GET /{id} — несуществующий → 404")
    void getDish_NotFound() throws Exception {
        mockMvc.perform(get("/api/dishes/{id}", 999999L))
                .andExpect(status().isNotFound());
    }

    // ===================== UPDATE / DELETE =====================

    @Test
    @DisplayName("UPDATE — пересчёт КБЖУ и порции")
    void updateDish() throws Exception {
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

    @Test
    @DisplayName("DELETE — успешное удаление")
    void deleteDish() throws Exception {
        Long pid = utils.createProductAndGetId("Продукт");
        Long dishId = utils.createSimpleDish(pid, "На удаление", 300f, 100f);

        mockMvc.perform(delete("/api/dishes/{id}", dishId))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/dishes/{id}", dishId))
                .andExpect(status().isNotFound());
    }
}
