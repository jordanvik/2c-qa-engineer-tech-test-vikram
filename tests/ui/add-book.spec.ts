// Covers all scenarios for the /add-book form, including responsive layout.

import { SEED_BOOK } from '../support/data/app-seeded-book-constants';
import { UI_FORM_STRINGS } from '../support/data/invalid-book-payloads';
import { expectBooksCatalogOk } from '../support/helpers/wait-for-books-catalog';
import { expect, test } from '../support/fixtures';

// Happy path 

test.describe('Add book form (happy path)', { tag: ['@ui', '@add-book'] }, () => {
  test(
    'Verifying that filling the required fields and submitting shows a success banner and redirects to the newly created book detail page',
    async ({ page, submitNewBookFormWorkflow, addNewBookPage, bookDetailsPage }) => {
      const { title, author } =
        await submitNewBookFormWorkflow.fillSubmitWithUniqueLiteraturePayload();

      await expect(addNewBookPage.successHeading()).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/book\/\d+/, { timeout: 15_000 });

      await expect(bookDetailsPage.titleHeadingNamed(title)).toBeVisible({ timeout: 15_000 });
      await expect(bookDetailsPage.authorLine(author)).toBeVisible({ timeout: 15_000 });
    },
  );

  test('Verifying that clicking "Add Another Book" on the detail page after a successful submission navigates back to the add book form', async ({
    page,
    submitNewBookFormWorkflow,
    addNewBookPage,
  }) => {
    await submitNewBookFormWorkflow.fillSubmitWithUniqueLiteraturePayload();
    await expect(page).toHaveURL(/\/book\/\d+/, { timeout: 15_000 });

    await page.getByRole('link', { name: /add another book/i }).click();

    await expect(addNewBookPage.formHeading()).toBeVisible();
    await expect(page).toHaveURL('/add-book');
  });
});

// Navigation / cancel 

test.describe('Back / Cancel navigation', { tag: ['@ui'] }, () => {
  test('Verifying that clicking "Back to Library" on the book detail page returns the user to the home page', async ({
    page,
    bookDetailsPage,
    bookLibraryHomePage,
  }) => {
    await bookDetailsPage.openById(SEED_BOOK.gatsbyId);
    await expect(bookDetailsPage.titleHeadingNamed(SEED_BOOK.gatsbyTitle)).toBeVisible();

    const catalogAfterBack = expectBooksCatalogOk(page);
    await bookDetailsPage.backToLibrary();
    await catalogAfterBack;

    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL('/');
  });

  test('Verifying that clicking Cancel on the add book form returns to the home page without saving the draft book', async ({
    page,
    addNewBookPage,
    bookLibraryHomePage,
  }) => {
    await addNewBookPage.open();
    await expect(addNewBookPage.formHeading()).toBeVisible();

    await addNewBookPage.fillRequired(UI_FORM_STRINGS.cancelDraftTitle, UI_FORM_STRINGS.cancelDraftAuthor);

    const catalogAfterCancel = expectBooksCatalogOk(page);
    await addNewBookPage.cancelLink().click();
    await catalogAfterCancel;

    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL('/');
    await expect(bookLibraryHomePage.bookCardHeading(UI_FORM_STRINGS.cancelDraftTitle)).not.toBeVisible();
  });
});

// Form field validation (expected behaviour) 

test.describe('Add book form — field validation', { tag: ['@ui', '@add-book'] }, () => {
  test('Verifying that leaving Pages at the default value of 0 and submitting is blocked — a book must have at least 1 page', async ({
    page,
    addNewBookPage,
  }) => {
    await addNewBookPage.open();
    // Fill only title + author; leave Pages at its default 0
    await addNewBookPage.fillRequired(UI_FORM_STRINGS.validTitle, UI_FORM_STRINGS.validAuthor);
    await addNewBookPage.submit();

    // HTML5 min="1" on the Pages field must prevent submission
    await expect(page).toHaveURL('/add-book');
    await expect(addNewBookPage.successHeading()).not.toBeVisible();
  });
});

// Negative / validation paths 

test.describe('Add book form — negative paths', { tag: ['@ui', '@add-book'] }, () => {
  test.fail(
    'Verifying that a whitespace-only title should show a validation error',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-003 — POST handler checks !body.title which passes for "   "; ' +
          'add trim() to the server to fix. Remove test.fail() when resolved.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.whitespaceOnly);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.validAuthor);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/title.*required|invalid title/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );

  test.fail(
    'Verifying that a whitespace-only author should show a validation error',
    {
      annotation: {
        type: 'issue',
        description: 'BUG-003 — same root cause as whitespace title.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.validTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.whitespaceOnly);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/author.*required|invalid author/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );

});

// Responsive layout — add book page (@responsive) 
// Runs on mobile-chrome / mobile-safari only
// Desktop projects exclude these via grepInvert: /@responsive/ in playwright.config.ts

test.describe('Mobile layout — add book page', { tag: ['@ui', '@responsive'] }, () => {
  test('Verifying that all form fields and the submit button on the add book page are visible and reachable without horizontal overflow', async ({
    page,
    addNewBookPage,
  }) => {
    await addNewBookPage.open();
    await expect(addNewBookPage.formHeading()).toBeVisible();

    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/author/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add book/i })).toBeVisible();

    const overflowX = await page.evaluate(() => {
      const { scrollWidth, clientWidth } = document.documentElement;
      return scrollWidth - clientWidth;
    });
    expect(overflowX, 'horizontal overflow px').toBe(0);
  });
});
