package com.example.AppTesting.utilities;

import com.example.AppTesting.models.api.DishIngredient;
import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.CookingStatus;
import com.example.AppTesting.models.enums.ProductCategory;

import java.util.Set;

public class ServiceForTests {
    public Product createProduct(float cals, float prot, float fats, float carbs) {
        Product p = new Product();
        p.setCalories(cals);
        p.setProtein(prot);
        p.setFats(fats);
        p.setCarbs(carbs);
        return p;
    }

    public DishIngredient createIngredient(Product product, float quantity) {
        DishIngredient di = new DishIngredient();
        di.setProduct(product);
        di.setQuantity(quantity);
        return di;
    }

    // Для третьей лабы

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
