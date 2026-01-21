const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/app/layout.tsx",
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/app/providers.tsx",
    "!src/lib/apollo-client.ts",
    "!src/types/**",
    "!src/generated/**",
    "!src/app/**/*Client.tsx",
    "!src/**/__tests__/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/.next/", "/coverage/"],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "!**/e2e/**",
    "!**/*.contract.test.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/e2e/", "e2e"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 56,
      lines: 62,
      statements: 61,
    },
  },
  maxWorkers: 16,
};

module.exports = createJestConfig(customJestConfig);
