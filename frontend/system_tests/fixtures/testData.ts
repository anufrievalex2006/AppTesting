export interface TestProduct {
    name: string;
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    category: string;
    status: string;
    flags?: string[];
}

export const generateValidProduct = (suffix = ""): TestProduct => ({
    name: `Тестовый продукт ${Date.now()}${suffix}`,
    calories: 250,
    protein: 20,
    fats: 15,
    carbs: 30,
    category: 'Овощи',
    status: 'Готовый к употреблению',
    flags: ['VEGAN']
});

export const generateProductInvalidBJU = (): TestProduct => ({
    name: `Тестовый продукт с некорректным БЖУ ${Date.now()}`,
    calories: 300,
    protein: 50,
    fats: 40,
    carbs: 80,
    category: 'Мясной',
    status: 'Готовый к употреблению'
});