import type { Page } from '@playwright/test';

const API_BOOKS_URL = '**/api/books';

// Simulates a transient server error on the FIRST call to GET /api/books,
// then lets all subsequent calls pass through to the real server.
// Used to test the "Try Again" retry path (BUG-001 regression).

export async function interceptFirstBookListWith500(page: Page): Promise<void> {
  let calls = 0;
  await page.route(API_BOOKS_URL, async route => {
    calls++;
    if (calls === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated server error' }),
      });
    } else {
      await route.continue();
    }
  });
}

// Fulfils every POST to /api/books with a 400 response body.
// GET requests are passed through so the page can still load the book list.

export async function interceptBookPostWith400(page: Page, errorMessage: string): Promise<void> {
  await page.route(API_BOOKS_URL, async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage }),
      });
    } else {
      await route.continue();
    }
  });
}

// Aborts every POST to /api/books to simulate a network failure.
// GET requests are passed through so the page can still load.

export async function interceptBookPostWithNetworkFailure(page: Page): Promise<void> {
  await page.route(API_BOOKS_URL, async route => {
    if (route.request().method() === 'POST') {
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
}
