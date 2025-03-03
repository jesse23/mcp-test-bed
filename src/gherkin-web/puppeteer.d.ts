interface Locator {
    click(): Promise<void>;
    toBeVisible(): Promise<boolean>;
    toContainText(text: string): Promise<boolean>;
    fill(value: string): Promise<void>;
}
interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
}
declare class ElementHandle {
    element: HTMLElement;
    textContent: string | null;
    constructor(element: HTMLElement);
    click(): Promise<void>;
    type(text: string): Promise<void>;
    getText(): Promise<string>;
    getAttribute(name: string): string | null;
    dispatchEvent(event: Event): void;
    dispose(): void;
}
declare class Page {
    goto(url: string): Promise<void>;
    setViewport(options: {
        width: number;
        height: number;
    }): Promise<void>;
    waitForSelector(selector: string): Promise<ElementHandle>;
    $(selector: string): Promise<ElementHandle | null>;
    $eval<T>(selector: string, fn: (element: Element) => T): Promise<T>;
    evaluate<T>(fn: (() => T) | ((arg: any) => T), arg?: any): Promise<T>;
    evaluateHandle<T>(fn: () => T): Promise<ElementHandle>;
    locator(selector: string): Locator;
    click(selector: string): Promise<void>;
}
declare const expect: (locator: Locator) => {
    toBeVisible(): Promise<boolean>;
    toContainText(text: string): Promise<boolean>;
};
declare const _default: {
    launch: (options?: {
        headless?: boolean;
        slowMo?: number;
    }) => Promise<Browser>;
};

export { _default as default, expect };
