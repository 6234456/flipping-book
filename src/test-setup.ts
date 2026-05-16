import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';

// Radix UI renders tooltip content twice: once visibly and once in a
// visually-hidden <span role="tooltip"> for accessibility. Excluding
// role="tooltip" elements from text queries prevents "found multiple elements"
// errors when using findByText/getByText against tooltip content.
configure({ defaultIgnore: 'script, style, [role="tooltip"]' });

// ResizeObserver is not available in jsdom; Radix UI's react-use-size requires it.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
  configurable: true,
});

// Provide a reliable localStorage implementation for tests
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});
