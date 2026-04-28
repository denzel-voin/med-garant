const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/__tests__"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: {
                    module: "CommonJS",
                    moduleResolution: "node",
                    esModuleInterop: true,
                    strict: true,
                },
            },
        ],
    },
    collectCoverageFrom: [
        "lib/slots.ts",
        "lib/validators/index.ts",
        "lib/api-helpers.ts",
        "lib/auth.ts",
    ],
    coverageReporters: ["text", "lcov"],
};

module.exports = config;