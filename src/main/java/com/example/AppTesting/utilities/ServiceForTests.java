package com.example.AppTesting.services;

import com.example.AppTesting.models.api.DishIngredient;
import com.example.AppTesting.models.api.Product;

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
}
