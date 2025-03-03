import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Given('I am on the news page', async function(page) {
    //await this.page.goto('http://localhost:5173'); // Assuming Vite's default port
    console.log(`I am on ${page}`)
});

Then('I should see the app content', async function() {
    await expect(this.page.locator('#root')).toBeVisible();
});

When('I click on the {string} button', async function(text) {
    await wait(1000);
    await this.page.click(`button:has-text("${text}")`);
});

Then('I should see the count increase to {string}', async function(count) {
    await expect(this.page.locator('button:has-text("count is")')).toContainText(`count is ${count}`);
});

When('I type {string} into the fetch news form', async function(text) {
    await wait(1000);
    await this.page.locator('#fetch-source').fill(text);
});

When('I clear the text input', async function() {
    await this.page.locator('#textInput').fill('');
});

Then('I should see {string} displayed in the text value', async function(expectedText) {
    await expect(this.page.locator('#textValue')).toContainText(expectedText);
}); 

