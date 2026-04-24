// Named payloads and form strings for negative / boundary test scenarios.
//   - Spec files import from here; no raw strings or inline objects in specs.
//   - `INVALID_API_PAYLOADS` — used by API-level tests (books-api.spec.ts).
//   - `UI_FORM_STRINGS`      — used by UI tests that fill form fields directly.

// API payloads 

export const INVALID_API_PAYLOADS = {
  // POST body with neither title nor author.
  emptyObject: {} as Record<string, unknown>,

  // POST body with title but no author.
  titleOnly: { title: 'Orphan Title' } as Record<string, unknown>,

  // POST body with author but no title.
  authorOnly: { author: 'Mystery Author' } as Record<string, unknown>,

  // POST body where title is an empty string (should return 400).
  blankTitle: { title: '', author: 'Virginia Woolf' },

  // POST body where author is an empty string (should return 400).
  blankAuthor: { title: 'The Metamorphosis', author: '' },

  // POST body where title is whitespace only.
  // The server currently accepts this — BUG-003 (trim-then-validate missing).
  whitespaceTitle: { title: '   ', author: 'Valid Author' },

  // POST body where author is whitespace only.
  // Same root cause as whitespace title — BUG-003.
  whitespaceAuthor: { title: 'Valid Title', author: '   ' },

  // POST body with a rating far above the documented 1–5 scale.
  // Server currently stores the value verbatim — BUG-014.
  ratingOverMax: { title: 'Rating Over Max', author: 'Test Author', rating: 99 },

  // POST body with a negative rating.
  // Server stores it verbatim — BUG-014.
  ratingBelowMin: { title: 'Rating Below Min', author: 'Test Author', rating: -5 },
} as const;

// UI form strings 

export const UI_FORM_STRINGS = {
  // Title filled during a cancel-flow test — should NOT appear in the book list.
  cancelDraftTitle: 'Abandoned Draft Title',
  cancelDraftAuthor: 'Draft Author',

  // Whitespace-only input for BUG-003 UI regression tests.
  whitespaceOnly: '   ',

  // Minimal valid values used when testing error-path form submissions.
  validTitle: 'Valid Title',
  validAuthor: 'Valid Author',
  genericTitle: 'Test Title',
  genericAuthor: 'Test Author',
  genericPages: '100',

  // Error message returned by the API that the UI must surface.
  apiErrorMessage: 'Title and author are required',

  // Shared strings for add-book-validation-bugs regression tests.

  // 300-character string — tests BUG-008 (no max-length on text fields).
  oversizedString: 'A'.repeat(300),

  // Extremely large page count — tests BUG-009 (no upper bound on Pages).
  hugePageCount: '999999999999',

  // Published year one year ahead of current — tests BUG-012 (future dates accepted).
  futureYear: String(new Date().getFullYear() + 1),

  // Purely numeric author value — tests BUG-011 (no format validation).
  numericOnlyAuthor: '12345678',

  // Special-characters-only title — tests BUG-011 (no format validation).
  specialCharOnlyTitle: '--------',

  // Number of mock books used to demonstrate missing pagination (BUG-013).
  paginationBookCount: 20,
} as const;
