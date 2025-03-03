interface Step {
    keyword: string;
    text: string;
}
interface CucumberWorld {
    [key: string]: any;
}
type StepImplementation = (this: CucumberWorld, ...args: any[]) => Promise<void> | void;
type HookImplementation = (this: CucumberWorld) => Promise<void> | void;
declare class World implements CucumberWorld {
    constructor();
}
declare const executeScenario: (scenarioName: string, steps: Step[]) => Promise<void>;
declare const setWorldConstructor: (constructor: new () => World) => void;
declare const Given: (pattern: string, implementation: StepImplementation) => void;
declare const When: (pattern: string, implementation: StepImplementation) => void;
declare const Then: (pattern: string, implementation: StepImplementation) => void;
declare const Before: (implementation: HookImplementation) => number;
declare const After: (implementation: HookImplementation) => number;

export { After, Before, Given, Then, When, World, executeScenario, setWorldConstructor };
