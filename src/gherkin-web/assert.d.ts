declare const assert: {
    (condition: boolean, message?: string): void;
    strictEqual<T>(actual: T, expected: T, message?: string): void;
};

export { assert as default };
