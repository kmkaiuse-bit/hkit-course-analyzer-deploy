/**
 * Jest setup file for DOM environment tests
 */
require('@testing-library/jest-dom');

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock fetch for browser environment
global.fetch = jest.fn();

// Mock btoa/atob for base64 operations
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString());

// Mock File and FileReader APIs
global.File = jest.fn();
global.FileReader = jest.fn(() => ({
  readAsArrayBuffer: jest.fn(),
  readAsText: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});