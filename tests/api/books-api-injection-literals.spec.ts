// SQL-style strings via POST — the store is in-memory JS, not a SQL engine.
// Assertions document that probes persist verbatim (no parser errors, no mutation).

import {
  SQL_INJECTION_LITERAL_DESCRIPTION,
  SQL_INJECTION_LITERAL_TITLE,
} from '../support/data/security-test-data';
import { buildUniqueLiteratureBookPayload } from '../support/data/unique-literature-book-payload-factory';
import { expect, test } from '../support/fixtures';

test.describe('Books API — injection-shaped literals (persistence)', { tag: ['@api', '@security'] }, () => {
  test('Verifying that POST /api/books with SQL-style strings in title and description returns 201 and GET returns those fields unchanged', async ({
    booksApiClient,
  }) => {
    const payload = buildUniqueLiteratureBookPayload({
      title: SQL_INJECTION_LITERAL_TITLE,
      description: SQL_INJECTION_LITERAL_DESCRIPTION,
    });

    const postRes = await booksApiClient.create(payload);
    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as { id: number };

    const getRes = await booksApiClient.getById(created.id);
    expect(getRes.status()).toBe(200);
    const book = (await getRes.json()) as { title: string; description: string };
    expect(book.title).toBe(SQL_INJECTION_LITERAL_TITLE);
    expect(book.description).toBe(SQL_INJECTION_LITERAL_DESCRIPTION);
  });
});
