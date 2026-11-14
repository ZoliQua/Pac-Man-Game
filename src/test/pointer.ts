import { vi } from 'vitest';

/** Fakes `matchMedia` so `(pointer: coarse)` matches on a touch device and nothing else does. */
export function mockPointer(coarse: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: coarse && query.includes('coarse'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export function resetPointer(): void {
  delete (window as { matchMedia?: unknown }).matchMedia;
}

/** Pointer-event init for one finger at (x, y). */
export const finger = (x: number, y: number) => ({
  clientX: x,
  clientY: y,
  pointerId: 1,
  pointerType: 'touch',
  isPrimary: true,
  button: 0,
});
