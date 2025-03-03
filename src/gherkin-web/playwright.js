// src/playwright.ts
var parseSelector = (sel) => {
  const hasTextMatch = sel.match(/^(.+):has-text\("([^"]+)"\)$/);
  if (hasTextMatch) {
    const [_, element, text] = hasTextMatch;
    return { element, text };
  }
  return { element: sel };
};
var findElementWithText = (element, text) => {
  const elements = Array.from(document.querySelectorAll(element));
  const found = elements.find((el) => el.textContent?.includes(text) ?? false);
  return found || null;
};
var createPageObject = () => ({
  async goto(url) {
    console.log("page: goto", url, " -- cannot implement this in browser for now");
  },
  locator(selector) {
    const { element, text } = parseSelector(selector);
    return {
      async click() {
        const el = text ? findElementWithText(element, text) : document.querySelector(element);
        if (el instanceof HTMLElement) {
          el.click();
        }
      },
      async toBeVisible() {
        const el = text ? findElementWithText(element, text) : document.querySelector(element);
        return el !== null;
      },
      async toContainText(expectedText) {
        const el = text ? findElementWithText(element, text) : document.querySelector(element);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          return el.value.includes(expectedText);
        }
        return el?.textContent?.includes(expectedText) ?? false;
      },
      async fill(value) {
        const el = text ? findElementWithText(element, text) : document.querySelector(element);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeInputValueSetter?.call(el, value);
          const event = new Event("input", { bubbles: true });
          el.dispatchEvent(event);
        }
      }
    };
  },
  async click(selector) {
    return this.locator(selector).click();
  }
});
var expect = (locator) => ({
  async toBeVisible() {
    return locator.toBeVisible();
  },
  async toContainText(text) {
    const result = await locator.toContainText(text);
    if (result) {
      console.log("expect: toContainText result:", result);
    } else {
      console.error("expect: toContainText result:", result);
    }
    return result;
  }
});
var chromium = {
  launch: () => ({
    newContext: () => ({
      newPage: () => createPageObject()
    }),
    close: async () => {
      console.log("\u{1F9F9} Cleaned up browser resources");
    }
  })
};
export {
  chromium,
  expect
};
//# sourceMappingURL=playwright.js.map