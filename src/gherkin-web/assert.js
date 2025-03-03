// src/assert.ts
var assert = (condition, message = "Assertion failed") => {
  console.assert(condition, message);
};
assert.strictEqual = (actual, expected, message = "Values are not strictly equal") => {
  console.assert(actual === expected, message);
};
var assert_default = assert;
export {
  assert_default as default
};
//# sourceMappingURL=assert.js.map