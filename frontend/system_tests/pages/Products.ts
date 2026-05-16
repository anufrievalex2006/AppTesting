import { BasePage } from "./Base";
import { expect } from '@playwright/test';

export class ProductsPage extends BasePage {
    // Кнопки
    createButton = () => this.page.getByTestId('product-create-button');
    submitButton = () => this.page.getByTestId('product-submit-button');
    cancelButton = () => this.page.getByTestId('product-cancel-button');

    // Поля формы
    nameInput = () => this.page.getByTestId('product-name-input');
    caloriesInput = () => this.page.getByTestId('product-calories-input');
    proteinInput = () => this.page.getByTestId('product-protein-input');
    fatsInput = () => this.page.getByTestId('product-fats-input');
    carbsInput = () => this.page.getByTestId('product-carbs-input');

    // Select'ы
    categorySelect = () => this.page.getByTestId('product-category-select');
    statusSelect = () => this.page.getByTestId('product-status-select');

    // Таблица
    getProductRow = (name: string) => 
        this.page.getByRole('row').filter({ hasText: name }).first();

    async openCreateModal() {
        await this.createButton().click();
        await expect(this.nameInput()).toBeVisible();
        // await this.page.waitForTimeout(800);
    }

    async selectCategory(categoryLabel: string) {
        const currentValue = await this.categorySelect().inputValue();
        if (currentValue && currentValue.includes(categoryLabel)) return;
        await this.categorySelect().click();
        // await this.page.waitForTimeout(300);
        await this.page.getByRole('option', { name: categoryLabel, exact: true }).click();
    }

    async selectStatus(statusLabel: string) {
        const currentValue = await this.statusSelect().inputValue();
        if (currentValue && currentValue.includes(statusLabel)) return;
        await this.statusSelect().click();
        // await this.page.waitForTimeout(300);
        await this.page.getByRole('option', { name: statusLabel }).click();
    }

    async fillProductForm(product: {
        name: string;
        calories: number;
        protein: number;
        fats: number;
        carbs: number;
        category?: string;
        status?: string;
    }) {
        await this.nameInput().fill(product.name);
        // await this.page.waitForTimeout(400);
        await this.caloriesInput().fill(product.calories.toString());
        // await this.page.waitForTimeout(300);
        await this.proteinInput().fill(product.protein.toString());
        // await this.page.waitForTimeout(300);
        await this.fatsInput().fill(product.fats.toString());
        // await this.page.waitForTimeout(300);
        await this.carbsInput().fill(product.carbs.toString());
        // await this.page.waitForTimeout(800);

        if (product.category) {
            await this.selectCategory(product.category);
            // await this.page.waitForTimeout(300);
        }
        if (product.status) {
            await this.selectStatus(product.status);
            // await this.page.waitForTimeout(300);
        }
    }

    async submitForm() {
        await this.submitButton().click();
        await expect(this.page.getByRole('dialog')).toBeHidden();
    }

    async clickSubmit() {
        await this.submitButton().click();
    }

    async closeModal() {
        await this.cancelButton().click();
    }

    async clickEditForProduct(name: string) {
        const row = this.getProductRow(name);
        await row.getByRole('button').first().click();
    }
}