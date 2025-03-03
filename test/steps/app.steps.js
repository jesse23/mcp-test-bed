import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am on the homepage', async function() {
    await this.page.goto('http://localhost:5173'); // Assuming Vite's default port
});

Then('I should see the app content', async function() {
    await expect(this.page.locator('#root')).toBeVisible();
});

When('I click the button', async function() {
    await this.page.click('button:has-text("count is")');
});

Then('I should see the count increase to {string}', async function(count) {
    await expect(this.page.locator('button:has-text("count is")')).toContainText(`count is ${count}`);
});

When('I type {string} into the text input', async function(text) {
    await this.page.locator('#textInput').fill(text);
});

When('I clear the text input', async function() {
    await this.page.locator('#textInput').fill('');
});

Then('I should see {string} displayed in the text value', async function(expectedText) {
    await expect(this.page.locator('#textValue')).toContainText(expectedText);
}); 

