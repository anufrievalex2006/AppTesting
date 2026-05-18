import { Page, expect } from '@playwright/test';

export abstract class BasePage {
    readonly page: Page;
    constructor(page: Page) {
        this.page = page;
    }

    async goto(url: string = "") {
        await this.page.goto(url, {
            waitUntil: 'networkidle'
        });
    }
    async expectNotification(messageContains: string) {
        await expect(
            this.page.locator('.mantine-Notification-root')
                .filter({ hasText: messageContains })
                .first()
        ).toBeVisible();
    }
}