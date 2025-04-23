// Jest setup file
// You can add global test configurations here

// Mock browser APIs if needed
if (typeof window === 'undefined') {
  global.window = {} as any;
}

// Mock IndexedDB for tests
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

global.indexedDB = indexedDB as any;

// Silence console.error during tests
global.console.error = jest.fn();

// Add any other global mocks or setup logic here 