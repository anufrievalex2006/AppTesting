import type { AdditionalFlag, DishCategory } from "./enums";
import type { Product } from "./product";

export interface DishIngredient {
    product: Product;
    quantity: number;
}

export interface DishIngredientDto {
    productId: number;
    quantity: number;
}

export interface Dish {
    id: number;
    name: string;
    imgUrls: string[];
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    portionSize: number;
    category: DishCategory;
    flags: AdditionalFlag[];
    ingredients: DishIngredient[];
    createdAt: string;
    updatedAt?: string;
}

export interface DishDto {
    name: string;
    imgUrls: string[];
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    portionSize: number;
    category?: DishCategory;
    flags?: AdditionalFlag[];
    ingredients: DishIngredientDto[];
}