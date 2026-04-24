// Seed book data 

// Mirrors built-in seed row 
export const GATSBY_BOOK = {
  id: 1,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic',
  publishedYear: 1925,
  pages: 180,
  rating: 4.2,
  description: 'A story of decadence.',
  isbn: '978-0743273565',
} as const;

// Fetch mock factories

import { vi } from 'vitest';

// Returns a `vi.fn()` that resolves to a successful fetch response wrapping `body`. Defaults to status 200

export function mockFetchOk(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// Returns a `vi.fn()` that resolves to an error fetch response, Body defaults to `{ error: 'not found' }`

export function mockFetchFail(status: number, body: unknown = { error: 'not found' }) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

// Returns a `vi.fn()` that never resolves (this simulates a pending request — use to assert loading states).

export function mockFetchPending() {
  return vi.fn().mockReturnValue(new Promise(() => {}));
}

// Returns a `vi.fn()` that rejects with a network-level error

export function mockFetchNetworkError(message = 'Network failure') {
  return vi.fn().mockRejectedValue(new Error(message));
}
