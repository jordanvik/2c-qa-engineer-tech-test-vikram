import { test as base, type TestInfo } from '@playwright/test';
import type { BooksApiClient } from '../clients/books-api-client';
import { createBooksApiClient } from '../clients/logging-books-api-client';
import type { ApiCallSnapshot } from '../helpers/api-response-capture';
import { AddNewBookPage } from '../pages/add-new-book-page';
import { BookDetailsPage } from '../pages/book-detail-page';
import { BookLibraryHomePage } from '../pages/book-library-home-page';
import { SubmitNewBookFormWorkflow } from '../workflows/submit-new-book-form-workflow';

/** Allure / HTML report: full Books API transcript on failure; on pass only if `PLAYWRIGHT_ATTACH_API=1`. */
async function maybeAttachBooksApiTranscript(
  testInfo: TestInfo,
  transcript: ApiCallSnapshot[],
): Promise<void> {
  if (transcript.length === 0) {
    return;
  }
  const attachAlways =
    process.env.PLAYWRIGHT_ATTACH_API === '1' ||
    process.env.PLAYWRIGHT_ATTACH_API === 'true';
  if (testInfo.status === 'skipped') {
    return;
  }
  if (testInfo.status === 'passed' && !attachAlways) {
    return;
  }
  await testInfo.attach('api-http-transcript.json', {
    body: Buffer.from(JSON.stringify(transcript, null, 2), 'utf-8'),
    contentType: 'application/json',
  });
}

type BookAppFixtures = {
  bookLibraryHomePage: BookLibraryHomePage;
  addNewBookPage: AddNewBookPage;
  bookDetailsPage: BookDetailsPage;
  booksApiClient: BooksApiClient;
  submitNewBookFormWorkflow: SubmitNewBookFormWorkflow;
};

export const test = base.extend<BookAppFixtures>({
  bookLibraryHomePage: async ({ page }, use) => {
    await use(new BookLibraryHomePage(page));
  },
  addNewBookPage: async ({ page }, use) => {
    await use(new AddNewBookPage(page));
  },
  bookDetailsPage: async ({ page }, use) => {
    await use(new BookDetailsPage(page));
  },
  booksApiClient: async ({ request }, use, testInfo) => {
    const transcript: ApiCallSnapshot[] = [];
    await use(createBooksApiClient(request, { transcript }));
    await maybeAttachBooksApiTranscript(testInfo, transcript);
  },
  submitNewBookFormWorkflow: async ({ addNewBookPage }, use) => {
    await use(new SubmitNewBookFormWorkflow(addNewBookPage));
  },
});

export const testApi = base.extend<{ booksApiClient: BooksApiClient }>({
  booksApiClient: async ({ request }, use, testInfo) => {
    const transcript: ApiCallSnapshot[] = [];
    await use(createBooksApiClient(request, { transcript }));
    await maybeAttachBooksApiTranscript(testInfo, transcript);
  },
});

export { expect } from '@playwright/test';
