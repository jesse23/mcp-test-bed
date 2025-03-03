interface Locator {
    click(): Promise<void>;
    toBeVisible(): Promise<boolean>;
    toContainText(text: string): Promise<boolean>;
    fill(value: string): Promise<void>;
}
interface PageObject {
    goto(url: string): Promise<void>;
    locator(selector: string): Locator;
    click(selector: string): Promise<void>;
}
interface BrowserContext {
    newPage(): PageObject;
}
interface Browser {
    newContext(): BrowserContext;
    close(): Promise<void>;
}
declare const expect: (locator: Locator) => {
    toBeVisible(): Promise<boolean>;
    toContainText(text: string): Promise<boolean>;
};
declare const chromium: {
    launch: () => Browser;
};

export { chromium, expect };
