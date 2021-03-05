module.exports = {
  collectCoverage: true,
  coverageDirectory: "<rootDir>/jest",
  coverageReporters: ["json", "lcov", "text", "cobertura"],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  globals: {
    "ts-jest": {
      diagnostics: false,
      tsConfig: "tsconfig.json",
      packageJson: "package.json",
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "office-ui-fabric-react/lib/(.*)":
      "<rootDir>/node_modules/office-ui-fabric-react/lib-commonjs/$1",
    "^resx-strings/en-us.json":
      "<rootDir>/node_modules/@microsoft/sp-core-library/lib/resx-strings/en-us.json",
  },
  reporters: ["jest-standard-reporter", "jest-junit"],
  testMatch: ["<rootDir>/src/**/*.test.+(ts|js)?(x)"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  unmockedModulePathPatterns: ["react"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.d.ts",
    "!**/*.test.ts",
    "!**/node_modules/**",
    "!src/**/index.ts",
    "!src/**/*.types.ts",
  ],
};