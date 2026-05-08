import type { AdditionalFlag, CookingStatus, ProductCategory } from "./enums";

export interface Product {
    id: number;
    name: string;
    imgUrls: string[];
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    composition?: string;
    category: ProductCategory;
    status: CookingStatus;
    flags: AdditionalFlag[];
    createdAt: string;
    updatedAt?: string;
}