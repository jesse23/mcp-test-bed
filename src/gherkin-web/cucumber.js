// src/cucumber.ts
var stepStore = {
  given: /* @__PURE__ */ new Map(),
  when: /* @__PURE__ */ new Map(),
  then: /* @__PURE__ */ new Map()
};
var hooks = {
  before: [],
  after: []
};
var World = class {
  constructor() {
  }
};
var WorldConstructor = World;
var lastStepType = "given";
var convertToRegex = (pattern) => {
  const regexPattern = pattern.replace(/{string}/g, '"([^"]*)"').replace(/{(\w+)}/g, "([^\\s]*)");
  return new RegExp(`^${regexPattern}$`);
};
var findMatchingStep = (store, text) => {
  for (const [pattern, implementation] of store.entries()) {
    if (typeof pattern === "string") {
      const regex = convertToRegex(pattern);
      const match = text.match(regex);
      if (match) {
        const params = match.slice(1).filter((p) => p !== void 0);
        return { implementation, params };
      }
    }
  }
  return null;
};
var addStepDefinition = (type, pattern, implementation) => {
  stepStore[type.toLowerCase()].set(pattern, implementation);
};
var executeStep = async (context, type, text) => {
  const stepType = type.toLowerCase() === "and" ? lastStepType : type.toLowerCase();
  if (type.toLowerCase() !== "and") {
    lastStepType = stepType;
  }
  const store = stepStore[stepType];
  const match = findMatchingStep(store, text);
  if (match) {
    const { implementation, params } = match;
    await implementation.apply(context, params);
  } else {
    console.warn(`No implementation found for ${type} "${text}"`);
  }
};
var executeBefore = async (context) => {
  for (const beforeHook of hooks.before) {
    await beforeHook.apply(context);
  }
};
var executeAfter = async (context) => {
  for (const afterHook of hooks.after) {
    await afterHook.apply(context);
  }
};
var executeScenario = async (scenarioName, steps) => {
  console.log(`
Executing Scenario: ${scenarioName}`);
  lastStepType = "given";
  const context = new WorldConstructor();
  await executeBefore(context);
  try {
    for (const step of steps) {
      const keyword = step.keyword.trim().toLowerCase();
      await executeStep(context, keyword, step.text);
    }
  } finally {
    await executeAfter(context);
  }
};
var setWorldConstructor = (constructor) => {
  WorldConstructor = constructor;
};
var Given = (pattern, implementation) => addStepDefinition("given", pattern, implementation);
var When = (pattern, implementation) => addStepDefinition("when", pattern, implementation);
var Then = (pattern, implementation) => addStepDefinition("then", pattern, implementation);
var Before = (implementation) => {
  hooks.before.push(implementation);
  return hooks.before.length;
};
var After = (implementation) => {
  hooks.after.push(implementation);
  return hooks.after.length;
};
export {
  After,
  Before,
  Given,
  Then,
  When,
  World,
  executeScenario,
  setWorldConstructor
};
//# sourceMappingURL=cucumber.js.map