import { BasePage } from "./Base";
import { expect } from '@playwright/test';

export class DishesPage extends BasePage {
    createButton = () => this.page.getByRole('button', { name: '+ Новое блюдо' });
    submitButton = () => this.page.getByTestId('dish-submit-button');
    cancelButton = () => this.page.getByTestId('dish-cancel-button');
    categorySelect = () => this.page.getByTestId('dish-category-select');
    nameInput = () => this.page.getByTestId('dish-name-input');
    addIngredientButton = () => this.page.getByTestId('dish-addingredient-button');

    getDishRow = (name: string) => 
        this.page.getByRole('row').filter({ hasText: name }).first();

    async openCreateModal() {
        await this.createButton().click();
        await expect(this.nameInput()).toBeVisible({ timeout: 10000 });
        await this.page.waitForTimeout(300);
    }

    async fillDishName(name: string) {
        await this.nameInput().fill(name);
        await this.page.waitForTimeout(400);
    }

    async addIngredient(productName: string, quantity: number = 100) {
        await this.addIngredientButton().click();
        await this.page.waitForTimeout(500);

        const productSelect = this.page.getByTestId('dish-product-select').last();
        await productSelect.click();
        await this.page.getByRole('option', { name: productName, exact: true }).click();

        const qtyInput = this.page.getByTestId('dish-quantity-select').last();
        await qtyInput.fill(quantity.toString());
        await this.page.waitForTimeout(300);
    }

    async submitForm() {
        await this.submitButton().click();
        await expect(this.page.getByRole('dialog')).toBeHidden({ timeout: 12000 }).catch(() => {});
    }

    async clickSubmit() {
        await this.submitButton().click();
    }

    async selectCategory(categoryLabel: string) {
        await this.categorySelect().click();
        await this.page.getByRole('option', { name: categoryLabel, exact: true }).click();
    }

    async closeModal() {
        await this.cancelButton().click();
    }
}