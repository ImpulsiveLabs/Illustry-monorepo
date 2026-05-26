module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['text', 'text-summary'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    'uuid$': '<rootDir>/../../backend/__tests__/mocks/uuid.cjs'
  },
  testEnvironment: 'node'
};
