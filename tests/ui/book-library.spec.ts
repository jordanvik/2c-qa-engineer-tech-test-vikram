// Book Library — browsing, navigation journeys, and responsive layout.

import { SEED_BOOK } from '../support/data/app-seeded-book-constants';
import { interceptFirstBookListWith500 } from '../support/helpers/route-interceptors';
import { expectBooksCatalogOk } from '../support/helpers/wait-for-books-catalog';
import { expect, test } from '../support/fixtures';

// Browsing & navigation 

test.describe('Home + book detail routing', { tag: ['@ui', '@smoke'] }, () => {
  test('Verifying that the home page displays the library heading and seed books on load', async ({ bookLibraryHomePage }) => {
    await bookLibraryHomePage.open();
    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();
    await expect(bookLibraryHomePage.bookCardHeading(SEED_BOOK.gatsbyTitle)).toBeVisible();
  });

  test('Verifying that clicking a book card on the home page navigates to the book detail page showing title and author', async ({
    bookLibraryHomePage,
    bookDetailsPage,
  }) => {
    await bookLibraryHomePage.open();
    await bookLibraryHomePage.openBookByTitle(SEED_BOOK.gatsbyTitle);
    await expect(bookDetailsPage.titleHeadingNamed(SEED_BOOK.gatsbyTitle)).toBeVisible();
    await expect(bookDetailsPage.authorLine(SEED_BOOK.gatsbyAuthor)).toBeVisible();
  });

  test('Verifying that clicking "Add New Book" on the home page navigates to the add book form', async ({ bookLibraryHomePage, addNewBookPage }) => {
    await bookLibraryHomePage.open();
    await bookLibraryHomePage.goToAddBook();
    await expect(addNewBookPage.formHeading()).toBeVisible();
  });

  test('Verifying that navigating to a non-existent book id shows a user-friendly error message rather than a blank page', async ({ bookDetailsPage }) => {
    await bookDetailsPage.openById(SEED_BOOK.nonExistentId);
    await expect(bookDetailsPage.errorOrNotFoundMessage()).toBeVisible({ timeout: 10_000 });
  });
});

// Error-state regression (BUG-001): only the "Try Again" scenario uses test.fail().
// The invalid-id → valid-id journey is a passing guard (no open defect).

test.describe('Error-state regression (BUG-001)', { tag: ['@ui', '@regression'] }, () => {
  test.fail(
    'Verifying that clicking "Try Again" after a failed load should clear the error banner and show the book list',
    async ({ page, bookLibraryHomePage }) => {
      await interceptFirstBookListWith500(page);

      await bookLibraryHomePage.open();
      await expect(page.getByText(/error|failed/i).first()).toBeVisible({ timeout: 10_000 });
      const catalogAfterRetry = expectBooksCatalogOk(page);
      await page.getByRole('button', { name: /try again/i }).click();
      await catalogAfterRetry;

      // BUG-001: setError(null) never called on success — error banner persists.
      await expect(bookLibraryHomePage.libraryHeading()).toBeVisible({ timeout: 15_000 });
    },
  );

  test('Verifying that navigating from a missing book to a valid one should show the new book', async ({ bookDetailsPage, page }) => {
      await bookDetailsPage.openById(SEED_BOOK.nonExistentId);
      await expect(bookDetailsPage.errorOrNotFoundMessage()).toBeVisible({ timeout: 10_000 });

      await bookDetailsPage.openById(SEED_BOOK.gatsbyId);

      await expect(
        bookDetailsPage.titleHeadingNamed(SEED_BOOK.gatsbyTitle),
      ).toBeVisible({ timeout: 10_000 });
      await expect(bookDetailsPage.errorOrNotFoundMessage()).not.toBeVisible();
    });
});

// Responsive layout — home and detail pages (@responsive)
// Runs on mobile-chrome / mobile-safari only
// Desktop projects exclude these via grepInvert: /@responsive/ in playwright.config.ts

test.describe('Mobile layout — home and detail pages', { tag: ['@ui', '@responsive'] }, () => {
  test('Verifying that the home page shows the Add New Book button and book cards without horizontal overflow on a mobile viewport', async ({
    page,
    bookLibraryHomePage,
  }) => {
    await bookLibraryHomePage.open();
    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();

    await expect(bookLibraryHomePage.addNewBookLink()).toBeVisible();
    await expect(bookLibraryHomePage.bookCardHeading(SEED_BOOK.gatsbyTitle)).toBeVisible();

    const overflowX = await page.evaluate(() => {
      const { scrollWidth, clientWidth } = document.documentElement;
      return scrollWidth - clientWidth;
    });
    expect(overflowX, 'horizontal overflow px').toBe(0);
  });

  test('Verifying that book cards stack vertically in a single column on a narrow mobile viewport', async ({
    page,
    bookLibraryHomePage,
  }) => {
    await bookLibraryHomePage.open();
    await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();

    const cards = page.getByRole('link').filter({
      has: page.getByRole('heading', { level: 2 }),
    });
    const count = await cards.count();

    if (count >= 2) {
      const box0 = await cards.nth(0).boundingBox();
      const box1 = await cards.nth(1).boundingBox();
      if (box0 && box1) {
        const viewportWidth = page.viewportSize()?.width ?? 375;
        expect(box0.width, 'card 0 width').toBeGreaterThan(viewportWidth * 0.7);
        expect(box1.width, 'card 1 width').toBeGreaterThan(viewportWidth * 0.7);
        expect(box1.y, 'card 1 top > card 0 bottom').toBeGreaterThan(box0.y + box0.height - 10);
      }
    }
  });

  test('Verifying that the book detail page shows the title and author without horizontal overflow on a mobile viewport', async ({
    page,
    bookDetailsPage,
  }) => {
    await bookDetailsPage.openById(SEED_BOOK.gatsbyId);
    await expect(bookDetailsPage.titleHeadingNamed(SEED_BOOK.gatsbyTitle)).toBeVisible();
    await expect(bookDetailsPage.authorLine(SEED_BOOK.gatsbyAuthor)).toBeVisible();

    const overflowX = await page.evaluate(() => {
      const { scrollWidth, clientWidth } = document.documentElement;
      return scrollWidth - clientWidth;
    });
    expect(overflowX, 'horizontal overflow px').toBe(0);
  });
});
