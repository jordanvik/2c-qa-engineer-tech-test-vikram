// axe WCAG-oriented scans in `tests/accessibility/` (separate from UI journey specs).
// Pattern matches other bug-backed tests: **no product fix required in this repo** — serious/critical
// violations are logged as **BUG-015**; routes that axe flags use `test.fail()` until the defect is fixed.

import AxeBuilder from '@axe-core/playwright';
import { SEED_BOOK } from '../support/data/app-seeded-book-constants';
import { expect, test } from '../support/fixtures';
import { attachAxeReport, seriousOrCritical } from '../support/helpers/axe-wcag-report';

test.describe('Accessibility — axe WCAG AA smoke', { tag: ['@accessibility', '@a11y', '@bug'] }, () => {
  test.fail(
    'Verifying that the home library page has no serious or critical axe violations',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-015 — Rating / star affordances use low-contrast yellow on white; axe reports serious `color-contrast`. ' +
          'Fix in product CSS/markup; remove this `test.fail()` when clean.',
      },
    },
    async ({ bookLibraryHomePage, page }, testInfo) => {
      await bookLibraryHomePage.open();
      await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      await attachAxeReport(testInfo, 'home', results);

      const blocking = seriousOrCritical(results.violations);
      expect(
        blocking,
        blocking.length ? JSON.stringify(blocking, null, 2) : '',
      ).toEqual([]);
    },
  );

  test('Verifying that the add book page has no serious or critical axe violations', async ({
    addNewBookPage,
    page,
  }, testInfo) => {
    await addNewBookPage.open();
    await expect(addNewBookPage.formHeading()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    await attachAxeReport(testInfo, 'add-book', results);

    const blocking = seriousOrCritical(results.violations);
    expect(
      blocking,
      blocking.length ? JSON.stringify(blocking, null, 2) : '',
    ).toEqual([]);
  });

  test.fail(
    'Verifying that the book detail page has no serious or critical axe violations',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-015 — Same colour-contrast class of issues on detail header and star row (`src/app/book/[id]/page.tsx`). ' +
          'Remove this `test.fail()` when axe reports zero serious/critical on this route.',
      },
    },
    async ({ bookDetailsPage, page }, testInfo) => {
      await bookDetailsPage.openById(SEED_BOOK.gatsbyId);
      await expect(bookDetailsPage.titleHeadingNamed(SEED_BOOK.gatsbyTitle)).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      await attachAxeReport(testInfo, 'book-detail', results);

      const blocking = seriousOrCritical(results.violations);
      expect(
        blocking,
        blocking.length ? JSON.stringify(blocking, null, 2) : '',
      ).toEqual([]);
    },
  );
});
