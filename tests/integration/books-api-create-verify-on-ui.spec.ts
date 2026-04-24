import type { Book } from '@/lib/books-data';
import type { CreateBookRequest } from '@/types/book';
import { buildUniqueLiteratureBookPayload } from '../support/data/unique-literature-book-payload-factory';
import { expect, test } from '../support/fixtures';

// POST → GET by id is covered in `tests/api/books-api.spec.ts`.
// This file cross-checks persistence: (1) catalog JSON, (2) the same row on the real UI.

test.describe('POST then verify catalog', { tag: ['@api', '@integration'] }, () => {
  test('Verifying that a newly created book appears in the full book list returned by the catalog endpoint', async ({ booksApiClient }) => {
    const payload: CreateBookRequest = buildUniqueLiteratureBookPayload();

    const postRes = await booksApiClient.create(payload);
    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as Book;

    const listRes = await booksApiClient.list();
    expect(listRes.status()).toBe(200);
    const list = (await listRes.json()) as Book[];

    const found = list.find((b) => b.id === created.id);
    expect(found).toBeDefined();
    expect(found!.title).toBe(payload.title);
    expect(found!.author).toBe(payload.author);
  });
});

test.describe('POST then verify on library UI', { tag: ['@integration', '@ui'] }, () => {
  test('Verifying that a book created via POST /api/books appears as a card on the home page and shows matching title and author on the detail page', async ({
    booksApiClient,
    bookLibraryHomePage,
    bookDetailsPage,
  }) => {
    const payload: CreateBookRequest = buildUniqueLiteratureBookPayload();

    const postRes = await booksApiClient.create(payload);
    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as Book;
    expect(created.id).toBeGreaterThan(0);

    await bookLibraryHomePage.open();
    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();
    const cardLink = bookLibraryHomePage.bookCardLinkWhereAuthor(payload.author);
    await expect(cardLink).toHaveCount(1);
    await expect(cardLink).toBeVisible();

    await bookLibraryHomePage.openBookWhereAuthor(payload.author);
    await expect(bookDetailsPage.titleHeadingNamed(payload.title)).toBeVisible();
    await expect(bookDetailsPage.authorLine(payload.author)).toBeVisible();
  });
});
