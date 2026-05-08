package com.example.AppTesting.dtos.requests;

import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.DishCategory;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class DishDto {
    private String name;
    private List<String> imgUrls;
    private float calories;
    private float protein;
    private float fats;
    private float carbs;
    private float portionSize;
    private DishCategory category;
    private Set<AdditionalFlag> flags;
    private List<DishIngredientDto> ingredients;
}
