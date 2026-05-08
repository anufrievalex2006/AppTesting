package com.example.AppTesting.dtos.responses;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NutritionInfoResponse {
    private float calories;
    private float protein;
    private float fats;
    private float carbs;
}
