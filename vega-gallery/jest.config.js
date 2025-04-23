/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.app.json',
    }],
  },
  testMatch: ['**/tests/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
}; 