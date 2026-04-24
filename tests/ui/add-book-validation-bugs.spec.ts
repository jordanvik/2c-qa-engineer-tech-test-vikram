// input validation bug regressions (TC-UI-13 to TC-UI-19).
//  Every test in this file is test.fail() because the bugs are still open.
// Remove test.fail() on the individual test when the corresponding bug is fixed.

import { UI_FORM_STRINGS } from '../support/data/invalid-book-payloads';
import { expect, test } from '../support/fixtures';

// TC-UI-13  BUG-007: Pages snaps back to 0 when cleared

test.describe('Pages field — clearing behaviour (BUG-007)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that clearing the Pages field should allow empty input so the user can type a fresh value — currently snaps back to 0 (BUG-007)',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-007 — handleInputChange uses parseInt(value) || 0. ' +
          'When the field is cleared, parseInt("") = NaN, NaN || 0 = 0, ' +
          'so React immediately re-renders with value 0. ' +
          'Fix: allow transient empty string; coerce to number on submit only.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();

      const pagesInput = addNewBookPage.pagesInput();

      // Triple-click to select-all then delete — simulates user trying to clear the field
      await pagesInput.click({ clickCount: 3 });
      await page.keyboard.press('Delete');

      // Expected: field is empty so user can type a fresh value
      await expect(pagesInput).toHaveValue('');
    },
  );
});

// TC-UI-14  BUG-008: No max-length on text fields 

test.describe('Text field length validation (BUG-008)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that the title field should reject input longer than a sensible max length — currently accepts 300+ characters (BUG-008)',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-008 — No maxLength prop on title, author, ISBN or description inputs. ' +
          'API also applies no length check. Oversized strings cause layout overflow on the detail page.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.oversizedString);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.validAuthor);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      // Expected: browser prevents submission or UI shows a validation message
      await expect(
        page.getByText(/too long|max.*char|character limit|maximum length/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );

  test.fail(
    'Verifying that the author field should reject input longer than a sensible max length',
    {
      annotation: { type: 'issue', description: 'BUG-008 — same root cause as title.' },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.validTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.oversizedString);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/too long|max.*char|character limit|maximum length/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );
});

// TC-UI-15  BUG-009: Pages field has no upper bound 

test.describe('Pages field — upper bound (BUG-009)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that the Pages field should reject large numbers',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-009 — Pages input has min="1" but no max attribute. ' +
          'JS number precision allows values like 1.09e+217 to be stored and ' +
          'displayed in scientific notation on the detail page.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.validTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.validAuthor);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.hugePageCount);
      await addNewBookPage.submit();

      // Expected: validation error, or submit blocked
      await expect(
        page.getByText(/too many|max.*page|invalid.*page|out of range/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );
});

// TC-UI-16  BUG-010: Rating spinner arrows 

test.describe('Rating spinner arrows (BUG-010)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that pressing the up arrow on the rating field should increment by 0.1',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-010 — parseInt("1.1") = 1, so every up-arrow click truncates the ' +
          'incremented decimal back to the same integer. The displayed value never changes.',
      },
    },
    async ({ addNewBookPage }) => {
      await addNewBookPage.open();

      const ratingInput = addNewBookPage.ratingInput();
      await ratingInput.fill('1');

      // Click up arrow — expects value to become 1.1
      await ratingInput.press('ArrowUp');
      await expect(ratingInput).toHaveValue('1.1');
    },
  );

  test.fail(
    'Verifying that pressing the down arrow on the rating field should decrement by 0.1',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-010 — parseInt("1.9") = 1, so a down-arrow click from 2 jumps to 1 ' +
          'instead of 1.9. Effective step is -1, not the declared step="0.1".',
      },
    },
    async ({ addNewBookPage }) => {
      await addNewBookPage.open();

      const ratingInput = addNewBookPage.ratingInput();
      await ratingInput.fill('2');

      // Click down arrow — expects value to become 1.9, not 1
      await ratingInput.press('ArrowDown');
      await expect(ratingInput).toHaveValue('1.9');
    },
  );

  test.fail(
    'Verifying that typing a decimal rating like 4.5 should preserve the value',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-002 / BUG-010 — parseInt("4.5") = 4. ' +
          'The decimal is lost as soon as the user finishes typing the fractional digit.',
      },
    },
    async ({ addNewBookPage }) => {
      await addNewBookPage.open();

      const ratingInput = addNewBookPage.ratingInput();
      await ratingInput.fill('4.5');

      // Expected: field retains "4.5"
      await expect(ratingInput).toHaveValue('4.5');
    },
  );
});

// TC-UI-17  BUG-011: No format validation on author / title 

test.describe('Author/title format validation (BUG-011)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that the author field should reject purely numeric values',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-011 — No pattern or custom validation on author input. ' +
          'A real person\'s name cannot be a number (e.g. "12345678").',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.validTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.numericOnlyAuthor);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/invalid.*author|author.*letter|author.*name/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );

  test.fail(
    'Verifying that the title field should reject special-character-only values',
    {
      annotation: {
        type: 'issue',
        description: 'BUG-011 — No pattern validation on title input.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.specialCharOnlyTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.validAuthor);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/invalid.*title|title.*letter|title.*alphanumeric/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );
});

// TC-UI-18  BUG-012: Published Year allows future dates 

test.describe('Published Year — future date validation (BUG-012)', { tag: ['@ui', '@add-book', '@bug'] }, () => {
  test.fail(
    'Verifying that the Published Year field should not accept a future year',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-012 — Input uses max={new Date().getFullYear() + 1}, allowing one year ahead. ' +
          'Books cannot have a future publication date; max should be current year.',
      },
    },
    async ({ page, addNewBookPage }) => {
      await addNewBookPage.open();
      await addNewBookPage.fillTitle(UI_FORM_STRINGS.validTitle);
      await addNewBookPage.fillAuthor(UI_FORM_STRINGS.validAuthor);
      await addNewBookPage.fillPublishedYear(UI_FORM_STRINGS.futureYear);
      await addNewBookPage.fillPages(UI_FORM_STRINGS.genericPages);
      await addNewBookPage.submit();

      await expect(
        page.getByText(/future|invalid.*year|year.*past|cannot.*future/i),
      ).toBeVisible({ timeout: 5_000 });
    },
  );
});

// TC-UI-19  BUG-013: No pagination on home page 

test.describe('Home page — pagination (BUG-013)', { tag: ['@ui', '@home', '@bug'] }, () => {
  test.fail(
    'Verifying that pagination controls should appear when the book list exceeds a page threshold',
    {
      annotation: {
        type: 'issue',
        description:
          'BUG-013 — GET /api/books returns every book with no limit/offset. ' +
          'The home page renders all cards in one unbounded list with no pagination UI. ' +
          'This test mocks 20 books to trigger the expected pagination threshold.',
      },
    },
    async ({ page, bookLibraryHomePage }) => {
      // Mock the API to return 20 books — enough to require pagination
      await page.route('**/api/books', async (route) => {
        const books = Array.from({ length: UI_FORM_STRINGS.paginationBookCount }, (_, i) => ({
          id: i + 1,
          title: `Pagination Test Book ${i + 1}`,
          author: `Author ${i + 1}`,
          genre: 'Fiction',
          publishedYear: 2024,
          description: `Book ${i + 1} for pagination test`,
          isbn: `ISBN-${i + 1}`,
          pages: 100,
          rating: 3,
        }));
        await route.fulfill({ json: books });
      });

      await bookLibraryHomePage.open();
      await expect(bookLibraryHomePage.libraryHeading()).toBeVisible();

      // Expected: pagination controls visible — not all 20 books shown at once
      await expect(
        page.getByRole('navigation', { name: /pagination/i })
          .or(page.getByRole('button', { name: /next|previous|load more/i }))
          .or(page.getByText(/page \d+ of \d+/i)),
      ).toBeVisible({ timeout: 5_000 });

      // Expected: only a subset of books is shown, not all 20
      const allCards = page.getByRole('heading', { name: /Pagination Test Book/i });
      await expect(allCards).not.toHaveCount(UI_FORM_STRINGS.paginationBookCount);
    },
  );
});


