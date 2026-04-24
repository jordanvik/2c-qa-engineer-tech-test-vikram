// Stored markup on the book detail page — script and img event-handler probes must not run.

import { buildUniqueLiteratureBookPayload } from '../support/data/unique-literature-book-payload-factory';
import {
  IMG_PROBE_PAYLOAD,
  IMG_PROBE_WINDOW_KEY,
  XSS_PROBE_PAYLOAD,
  XSS_PROBE_WINDOW_KEY,
} from '../support/data/security-test-data';
import { expect, test } from '../support/fixtures';

test.describe('Detail page — stored markup (script)', { tag: ['@ui', '@security'] }, () => {
  test('Verifying that Book detail page shows a title that contains a script tag as plain text — the browser does not run the script and no probe global is set', async ({
    booksApiClient,
    bookDetailsPage,
    page,
  }) => {
    const payload = buildUniqueLiteratureBookPayload(XSS_PROBE_PAYLOAD);

    const postRes = await booksApiClient.create(payload);
    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as { id: number };

    page.once('dialog', () => {
      throw new Error('Unexpected dialog — possible script execution');
    });

    await bookDetailsPage.openById(created.id);
    await expect(bookDetailsPage.titleHeading()).toContainText('<script>');

    const probe = await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key],
      XSS_PROBE_WINDOW_KEY,
    );
    expect(probe).toBeUndefined();
  });
});

test.describe('Detail page — stored markup (img onerror)', { tag: ['@ui', '@security'] }, () => {
  test('Verifying that Book detail page shows a title that contains an img tag as plain text — onerror does not run and the img probe global is unset', async ({
    booksApiClient,
    bookDetailsPage,
    page,
  }) => {
    const payload = buildUniqueLiteratureBookPayload(IMG_PROBE_PAYLOAD);

    const postRes = await booksApiClient.create(payload);
    expect(postRes.status()).toBe(201);
    const created = (await postRes.json()) as { id: number };

    await bookDetailsPage.openById(created.id);
    await expect(bookDetailsPage.titleHeading()).toContainText('<img');

    const probe = await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key],
      IMG_PROBE_WINDOW_KEY,
    );
    expect(probe).toBeUndefined();
  });
});
