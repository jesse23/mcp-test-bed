// src/puppeteer.ts
var triggerInputEvent = (element, value) => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeInputValueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
};
var ElementHandle = class {
  constructor(element) {
    this.element = element;
    if (!(element instanceof HTMLElement)) {
      throw new Error("Expected an HTMLElement");
    }
    this.textContent = element.textContent;
    this.element = element;
  }
  async click() {
    this.element.click();
  }
  async type(text) {
    triggerInputEvent(this.element, text);
  }
  async getText() {
    return this.element.innerText;
  }
  getAttribute(name) {
    return this.element.getAttribute(name);
  }
  dispatchEvent(event) {
    this.element.dispatchEvent(event);
  }
  dispose() {
    this.element = null;
  }
};
var Page = class {
  async goto(url) {
    console.log("page: goto", url);
  }
  async setViewport(options) {
    console.log("page: setViewport", options);
  }
  async waitForSelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return new ElementHandle(element);
  }
  async $(selector) {
    const element = document.querySelector(selector);
    return element ? new ElementHandle(element) : null;
  }
  async $eval(selector, fn) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return fn(element);
  }
  async evaluate(fn, arg) {
    return arg ? fn(arg) : fn();
  }
  async evaluateHandle(fn) {
    const result = fn();
    if (result instanceof Element) {
      return new ElementHandle(result);
    }
    throw new Error("evaluateHandle must return an Element");
  }
  locator(selector) {
    return {
      async click() {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          element.click();
        }
      },
      async toBeVisible() {
        return document.querySelector(selector) !== null;
      },
      async toContainText(text) {
        const element = document.querySelector(selector);
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          return element.value.includes(text);
        }
        return element?.textContent?.includes(text) ?? false;
      },
      async fill(value) {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          triggerInputEvent(element, value);
        }
      }
    };
  }
  async click(selector) {
    return this.locator(selector).click();
  }
};
var expect = (locator) => ({
  async toBeVisible() {
    return locator.toBeVisible();
  },
  async toContainText(text) {
    const result = await locator.toContainText(text);
    console[result ? "log" : "error"]("expect: toContainText result:", result);
    return result;
  }
});
var puppeteer_default = {
  launch: async (options) => {
    console.log("puppeteer: launch", options);
    return {
      async newPage() {
        return new Page();
      },
      async close() {
        console.log("\u{1F9F9} Cleaned up browser resources");
      }
    };
  }
};
export {
  puppeteer_default as default,
  expect
};
//# sourceMappingURL=puppeteer.js.map