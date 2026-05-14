package com.example.AppTesting;

import com.example.AppTesting.dtos.requests.DishDto;
import com.example.AppTesting.dtos.requests.DishIngredientDto;
import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.CookingStatus;
import com.example.AppTesting.models.enums.DishCategory;
import com.example.AppTesting.models.enums.ProductCategory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Для третьей лабы
public class Helper {
    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;

    public Helper(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    public DishDto buildDish(String name, float portion, DishCategory category,
                             DishIngredientDto ingredient) {
        DishDto dto = new DishDto();
        dto.setName(name);
        dto.setPortionSize(portion);
        dto.setCategory(category);
        dto.setIngredients(List.of(ingredient));
        return dto;
    }

    public Product createValidProduct(String name) {
        Product p = new Product();
        p.setName(name != null ? name : "Тест");
        p.setCalories(250);
        p.setProtein(20);
        p.setFats(15);
        p.setCarbs(30);
        p.setCategory(ProductCategory.VEGETABLES);
        p.setStatus(CookingStatus.READY);
        p.setFlags(Set.of(AdditionalFlag.VEGAN, AdditionalFlag.NO_GLUTEN, AdditionalFlag.NO_SUGAR));
        p.setComposition("состав корнеплод");
        return p;
    }

    public Long createProductAndGetId(String name) throws Exception {
        Product p = createValidProduct(name);
        String response = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).path("id").asLong();
    }

    public Long createSimpleDish(Long productId, String name, float portion, float qty) throws Exception {
        DishDto req = buildDish(name, portion, DishCategory.SECOND, new DishIngredientDto(productId, qty));
        String response = mockMvc.perform(post("/api/dishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).path("id").asLong();
    }

    // Остальные методы (createInvalidBJUProduct, createProduct) оставь как есть
    public Product createInvalidBJUProduct() {
        Product p = createValidProduct("с неправильным БЖУ");
        p.setProtein(40);
        p.setFats(40);
        p.setCarbs(30);
        return p;
    }

    public Product createProduct(String name, float cals, float prot, float fats, float carbs) {
        Product p = createValidProduct(name);
        p.setCalories(cals);
        p.setProtein(prot);
        p.setFats(fats);
        p.setCarbs(carbs);
        return p;
    }
}
