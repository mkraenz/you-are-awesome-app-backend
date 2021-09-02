module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    moduleFileExtensions: ["ts", "js", "json"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    testMatch: ["**/test/**/*.test.ts"],
    testEnvironment: "node",
    setupFiles: ["dotenv/config"],
    resetMocks: true,
    resetModules: true,
    restoreMocks: true,
};
