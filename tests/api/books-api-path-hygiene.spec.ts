// API path coercion and POST body hygiene — not classic infosec; documents `parseInt`
// behaviour on `[id]` and that unknown POST keys are not echoed.

import type { Book } from '@/lib/books-data';
import { buildUniqueLiteratureBookPayload } from '../support/data/unique-literature-book-payload-factory';
import { SEED_BOOK } from '../support/data/app-seeded-book-constants';
import { MASS_ASSIGNMENT_EXTRA_KEYS } from '../support/data/security-test-data';
import { expect, test } from '../support/fixtures';

test.describe('Books API — path segments & POST body hygiene', { tag: ['@api', '@boundary'] }, () => {
  test('Verifying that GET /api/books/1.5 returns 200 with book id 1 — the path is read as the number 1, not the decimal 1.5', async ({
    booksApiClient,
  }) => {
    const res = await booksApiClient.getByPathSegment('1.5');
    expect(res.status()).toBe(200);
    const book = (await res.json()) as Book;
    expect(book.id).toBe(SEED_BOOK.gatsbyId);
    expect(book.title).toBe(SEED_BOOK.gatsbyTitle);
  });

  test('Verifying that GET /api/books/abc returns 404 — letters are not a book id, so the API returns not found', async ({
    booksApiClient,
  }) => {
    const res = await booksApiClient.getByPathSegment('abc');
    expect(res.status()).toBe(404);
  });

  test('Verifying that POST /api/books with extra unknown fields in the body returns 201 but the response JSON does not include those extra keys', async ({
    booksApiClient,
  }) => {
    const base = buildUniqueLiteratureBookPayload();
    const res = await booksApiClient.createFromObject({ ...base, ...MASS_ASSIGNMENT_EXTRA_KEYS });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    for (const key of Object.keys(MASS_ASSIGNMENT_EXTRA_KEYS)) {
      expect(key in body, `response must not echo back "${key}"`).toBe(false);
    }
    expect(body.title).toBe(base.title);
  });
});
