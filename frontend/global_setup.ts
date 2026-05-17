import { request } from "@playwright/test";

const REQUIRED_PRODUCTS = [
    {
        name: 'Вода',
        calories: 0,
        protein: 0,
        fats: 0,
        carbs: 0,
        category: 'LIQUIDS',
        status: 'READY',
        flags: ['VEGAN', 'NO_GLUTEN', 'NO_SUGAR'],
        composition: '',
        imgUrls: [],
    },
    {
        name: 'Картофель',
        calories: 77,
        protein: 2,
        fats: 0.4,
        carbs: 16.3,
        category: 'VEGETABLES',
        status: 'NOT_DONE',
        flags: ['VEGAN', 'NO_GLUTEN', 'NO_SUGAR'],
        composition: '',
        imgUrls: [],
    },
    {
        name: 'Мясо',
        calories: 187.2,
        protein: 18.9,
        fats: 12.4,
        carbs: 0,
        category: 'MEAT',
        status: 'NOT_DONE',
        flags: ['NO_GLUTEN', 'NO_SUGAR'],
        composition: '',
        imgUrls: [],
    },
    {
        name: 'Свекла',
        calories: 43,
        protein: 1.5,
        fats: 0.1,
        carbs: 8.8,
        category: 'VEGETABLES',
        status: 'NOT_DONE',
        flags: ['VEGAN', 'NO_GLUTEN', 'NO_SUGAR'],
        composition: '',
        imgUrls: [],
    },
] as const;

export default async function globalSetup() {
    const BASE_URL = "http://localhost:8080";
    const ctx = await request.newContext({
        baseURL: BASE_URL
    });

    const res = await ctx.get("/api/products");
    if (!res.ok()) {
        throw new Error(
            `[global-setup] Не удалось получить список продуктов: ${res.status()} ${res.statusText()}`
        );
    }
    
    const existingProducts: {name: string}[] = await res.json();
    const names = new Set(existingProducts.map(p => p.name));
    for (const p of REQUIRED_PRODUCTS) {
        if (names.has(p.name)) {
            console.log(`[global-setup] ${p.name} уже существует, идем дальше`);
            continue;
        }

        const cres = await ctx.post("/api/products", {
            data: p
        });
        if (!cres.ok()) {
            const body = await cres.text();
            throw new Error(
                `[global-setup] Не удалось создать "${p.name}": ` +
                `${cres.status()} — ${body}`
            );
        }
        console.log(`[global-setup] "${p.name}" создано`);
    }
    await ctx.dispose();
}