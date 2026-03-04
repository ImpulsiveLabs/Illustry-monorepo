// vitest.setup.ts
import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

const noisyConsolePatterns = [
  'not wrapped in act(...)',
  '`DialogContent` requires a `DialogTitle`',
  'Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.',
  'cannot be a descendant of <a>',
  '<html> cannot be a child of <div>',
  'React does not recognize the `suggestionsConfig` prop',
  'Invalid prop `id` supplied to `React.Fragment`',
  'In HTML, <li> cannot be a descendant of <li>.',
  'In HTML, <html> cannot be a child of <div>.',
  'Warning: Missing `Description`'
];

beforeAll(() => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleDebug = console.debug;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (noisyConsolePatterns.some((pattern) => message.includes(pattern))) {
      return;
    }
    originalConsoleError(...args);
  });
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (noisyConsolePatterns.some((pattern) => message.includes(pattern))) {
      return;
    }
    originalConsoleWarn(...args);
  });
  vi.spyOn(console, 'debug').mockImplementation((...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (message.includes('Request failed')) {
      return;
    }
    originalConsoleDebug(...args);
  });
});
