package com.example.AppTesting.dtos.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DishIngredientDto {
    private Long productId;
    private float quantity;
}
