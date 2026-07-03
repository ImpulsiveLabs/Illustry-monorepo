module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/interactive.ts'],
  coverageReporters: ['text', 'text-summary'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@illustry/core$': '<rootDir>/../core/src/index.ts',
    'uuid$': '<rootDir>/../../backend/__tests__/mocks/uuid.cjs'
  },
  testEnvironment: 'node'
};
