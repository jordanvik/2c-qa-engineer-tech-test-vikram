// API tests — contract, boundary, and volume
// Each test name leads with the HTTP method + endpoint so the intent is visible at a glance.
// Every test body has a Request / Response comment block showing what is sent and what is checked.

import type { Book } from '@/lib/books-data';
import type { CreateBookRequest } from '@/types/book';
import { buildUniqueLiteratureBookPayload } from '../support/data/unique-literature-book-payload-factory';
import { SEED_BOOK } from '../support/data/app-seeded-book-constants';
import { INVALID_API_PAYLOADS } from '../support/data/invalid-book-payloads';
import { expectRequiredBookFields } from '../support/helpers/expect-required-book-fields';
import { expect, test } from '../support/fixtures';

// Contract

test.describe('Books API — contract', { tag: ['@api', '@contract'] }, () => {

  test('Verifying that doing a GET request to /api/books returns 200 with a non-empty array and the seed book is present', async ({ booksApiClient }) => {
    const res = await booksApiClient.list();
    expect(res.status()).toBe(200);

    const books = (await res.json()) as unknown[];
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThan(0);               // catalog must not be empty

    const gatsby = books.find(
      (b) => (b as Book).title === SEED_BOOK.gatsbyTitle,
    ) as Book | undefined;
    expect(gatsby).toBeDefined();                          // seed book must be present
    expect(gatsby!.author).toBe(SEED_BOOK.gatsbyAuthor);  // with the correct author
  });

  test('Verifying that when a book is added (using POST /api/books), then fetching (using GET /api/books/:id) the book with the same id should return details matching the book that was added', async ({ booksApiClient }) => {
    // Step 1 — POST /api/books
    // Payload:  unique literature book (title, author, genre, publishedYear,
    //           description, isbn, pages, rating) from buildUniqueLiteratureBookPayload()
    // Expected: 201 — created Book with a server-assigned numeric id

    const payload: CreateBookRequest = buildUniqueLiteratureBookPayload();
    const postRes = await booksApiClient.create(payload);

    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as Book;
    expectRequiredBookFields(created);                     // POST response must have all required fields
    expect(created.id).toBeGreaterThan(0);                

    // Step 2 — GET /api/books/:id  (using the id returned by the POST)
    // Payload:  (none)
    // Expected: 200 — every field must match what was originally submitted,
    //           confirming the book was persisted 
    const getRes = await booksApiClient.getById(created.id);
    expect(getRes.status()).toBe(200);

    const fetched = (await getRes.json()) as Book;
    expect(fetched.id).toBe(created.id);                  // same id as returned by POST
    expect(fetched.title).toBe(payload.title);
    expect(fetched.author).toBe(payload.author);
    expect(fetched.genre).toBe(payload.genre);
    expect(fetched.publishedYear).toBe(payload.publishedYear);
    expect(fetched.description).toBe(payload.description);
    expect(fetched.isbn).toBe(payload.isbn);
    expect(fetched.pages).toBe(payload.pages);
    expect(fetched.rating).toBe(payload.rating);
  });

  test('Verifying that doing a GET request to /api/books with a id of 999999 returns 404 with an error body when the requested id does not exist', async ({ booksApiClient }) => {
    const res = await booksApiClient.getById(SEED_BOOK.nonExistentId);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as { error?: string };
    expect(typeof body.error).toBe('string');
    expect(body.error!.toLowerCase()).toContain('not found');
  });

  test('Verifying that doing a POST request to /api/books with a title of an empty string returns 400', async ({ booksApiClient }) => {
    const res = await booksApiClient.create(INVALID_API_PAYLOADS.blankTitle);
    expect(res.status()).toBe(400);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test('Verifying that doing a POST request to /api/books with a author of an empty string returns 400', async ({ booksApiClient }) => {
    const res = await booksApiClient.create(INVALID_API_PAYLOADS.blankAuthor);
    expect(res.status()).toBe(400);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

});

// Boundary & negative paths

test.describe('Books API — boundary & negative paths', { tag: ['@api', '@boundary'] }, () => {

  test('Verifying that doing a GET request to /api/books with a id of 0 returns 404 because no book has id 0 in the catalog', async ({ booksApiClient }) => {
    const res = await booksApiClient.getById(0);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test('Verifying that doing a GET request to /api/books with a negative id returns 404', async ({ booksApiClient }) => {
    const res = await booksApiClient.getById(-1);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test('Verifying that doing a POST request to /api/books with an empty object body returns 400 because title and author are both required', async ({ booksApiClient }) => {
    const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.emptyObject);
    expect(res.status()).toBe(400);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test('Verifying that doing a POST request to /api/books with a author missing from the request body returns 400', async ({ booksApiClient }) => {
   
    const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.titleOnly);
    expect(res.status()).toBe(400);
  });

  test('Verifying that doing a POST request to /api/books with a title missing from the request body returns 400', async ({ booksApiClient }) => {

    const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.authorOnly);
    expect(res.status()).toBe(400);
  });

  test.fail(
    'Verifying that doing a POST request to /api/books with a whitespace-only title returns 400',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-003 — POST /api/books checks !body.title which passes for "   ". ' +
          'Fix: trim() the value before the presence check on the server.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.whitespaceTitle);
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a whitespace-only author returns 400',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-003 — same root cause as whitespace title. ' +
          'Fix: trim() author before the presence check on the server.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.whitespaceAuthor);
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a rating of 99 returns 400 because ratings must be within 0–5',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-014 — POST /api/books has no server-side range check on rating. ' +
          'A value of 99 returns 201 and is stored verbatim (same class as rating -1 / 0). ' +
          'Fix: reject any rating outside 0–5 with 400.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.ratingOverMax);
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a rating of -5 returns 400 because ratings must be within 0–5',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-014 — POST /api/books has no server-side range check on rating. ' +
          'A value of -5 returns 201 and is stored verbatim (same class as rating 99 / -1). ' +
          'Fix: reject any rating outside 0–5 with 400.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.createFromObject(INVALID_API_PAYLOADS.ratingBelowMin);
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a pages of 0 returns 400 because a book must have at least 1 page',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-004 — POST /api/books has no lower-bound check on pages. ' +
          'A value of 0 returns 201 and is stored verbatim. ' +
          'The UI correctly enforces min="1" but the API must not trust the UI. ' +
          'Fix: reject pages < 1 with 400 on the server.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.create(
        buildUniqueLiteratureBookPayload({ pages: 0 }),
      );
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a pages of -1 returns 400 because a book cannot have negative pages',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-004 — POST /api/books has no lower-bound check on pages. ' +
          'A negative value returns 201 and is stored verbatim. ' +
          'Fix: reject pages < 1 with 400 on the server.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.create(
        buildUniqueLiteratureBookPayload({ pages: -1 }),
      );
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a rating of 9.9 returns 400 because the valid range is 0–5',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-014 — POST /api/books has no server-side range check on rating. ' +
          'A value of 9.9 returns 201 and is stored verbatim. ' +
          'Fix: add server-side validation to reject any rating outside 0–5 with 400.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.create(
        buildUniqueLiteratureBookPayload({ rating: 9.9 }),
      );
      expect(res.status()).toBe(400);
    },
  );

  test.fail(
    'Verifying that doing a POST request to /api/books with a rating of -1 returns 400 because a rating cannot be negative',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-014 — POST /api/books has no server-side range check on rating. ' +
          'A value of -1 returns 201 and is stored verbatim. ' +
          'Fix: add server-side validation to reject any rating outside 0–5 with 400.',
      },
    },
    async ({ booksApiClient }) => {
      const res = await booksApiClient.create(
        buildUniqueLiteratureBookPayload({ rating: -1 }),
      );
      expect(res.status()).toBe(400);
    },
  );

  test('Verifying that doing a POST request to /api/books with a malformed JSON body returns 400 and the error message always reads "Invalid JSON"', async ({ request }) => {
   
    const res = await request.post('/api/books', {
      headers: { 'Content-Type': 'application/json' },
      data: '{ not valid json }',
    });
    expect(res.status()).toBe(400);

    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();                      // error message must be present
  });

});

// Volume / repeated creates

test.describe('Books API — repeated creates', { tag: ['@api', '@repeat'] }, () => {
  const REPEAT_COUNT = 10;

  test('Verifying that doing 10 POST requests to /api/books creates 10 books and assigns a unique id to each book', async ({ booksApiClient }) => {
    const ids: number[] = [];

    for (let i = 0; i < REPEAT_COUNT; i += 1) {
      const res = await booksApiClient.create(buildUniqueLiteratureBookPayload());
      expect(res.status(), `iteration ${i + 1} must return 201`).toBe(201);

      const book = (await res.json()) as Book;
      expect(book.id, `iteration ${i + 1} id must be positive`).toBeGreaterThan(0);
      ids.push(book.id);
    }

    expect(new Set(ids).size, 'all 10 ids must be unique — no id collision').toBe(REPEAT_COUNT);
  });

});
