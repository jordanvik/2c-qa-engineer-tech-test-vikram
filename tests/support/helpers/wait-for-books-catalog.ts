import type { Page, Response } from '@playwright/test';

/** True for GET of the book list (`/api/books`), not `/api/books/[id]`. */
export function isBooksCatalogListResponse(response: Response): boolean {
  if (response.request().method() !== 'GET') return false;
  try {
    return new URL(response.url()).pathname === '/api/books';
  } catch {
    return false;
  }
}

/**
 * Waits until a catalog list request finishes (any HTTP status).
 * Use after `goto('/')` so the home page leaves the indeterminate loading state.
 */
export function expectBooksCatalogRequest(page: Page) {
  return page.waitForResponse(isBooksCatalogListResponse, { timeout: 25_000 });
}

/**
 * Waits for the next **successful** catalog GET (2xx). Use after navigation or
 * "Try Again" when the list should render.
 */
export function expectBooksCatalogOk(page: Page) {
  return page.waitForResponse((r) => isBooksCatalogListResponse(r) && r.ok(), { timeout: 25_000 });
}
