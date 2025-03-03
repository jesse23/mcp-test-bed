import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';

class CustomWorld extends World {
    async init() {
        this.browser = await chromium.launch({ 
            channel: 'chrome',
            headless: true 
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async cleanup() {
        await this.browser.close();
    }
}

setWorldConstructor(CustomWorld);

// Add Before and After hooks
Before(async function() {
    await this.init();
});

After(async function() {
    await this.cleanup();
}); 