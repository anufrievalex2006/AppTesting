import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    globalSetup: "./global_setup",
    testDir: "./system_tests",
    timeout: 60000,
    retries: 2,
    workers: process.env.CI ? 2 : undefined,
    reporter: [['html'], ['list']],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        }
    ]   
})