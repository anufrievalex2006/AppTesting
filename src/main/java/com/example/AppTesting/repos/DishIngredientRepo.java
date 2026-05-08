package com.example.AppTesting.repos;

import com.example.AppTesting.models.api.DishIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DishIngredientRepo extends JpaRepository<DishIngredient, Long> {
    List<DishIngredient> findByProductId(Long productId);
}
