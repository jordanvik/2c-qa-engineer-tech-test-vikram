// Test data for security scenarios.
// Centralising probe strings and extra-key objects here means:
//   - the spec only states what it is asserting, not how the payload is constructed;
//   - the XSS probe window variable name is defined once and referenced in both the
//     payload title and the browser-side `page.evaluate` check.


// Stored-markup / XSS probe 

// Window variable name that the XSS probe would set if the script executed.
export const XSS_PROBE_WINDOW_KEY = '__PW_BOOK_XSS_PROBE' as const;

// Book payload overrides that inject a script tag into the title field.
export const XSS_PROBE_PAYLOAD = {
  title: `<script>window.${XSS_PROBE_WINDOW_KEY}=1</script>`,
  author: 'Security probe author',
} as const;

// Mass-assignment / extra-key probe 

// Extra keys that a malicious or misconfigured client might send.
// The API response must NOT echo these back.
export const MASS_ASSIGNMENT_EXTRA_KEYS = {
  isAdmin: true,
  internalRole: 'superuser',
} as const;

// HTML img + event-handler probe (stored markup; `onerror` must not run.)

export const IMG_PROBE_WINDOW_KEY = '__PW_BOOK_IMG_PROBE' as const;

export const IMG_PROBE_PAYLOAD = {
  title: `<img src=x onerror="window.${IMG_PROBE_WINDOW_KEY}=1">`,
  author: 'Security img probe author',
} as const;

// SQL-style strings (this app uses in-memory storage — no SQL interpreter).
// We still POST these to prove values are stored and returned as literal text.

export const SQL_INJECTION_LITERAL_TITLE = "Book' OR '1'='1" as const;
export const SQL_INJECTION_LITERAL_DESCRIPTION = "'; DROP TABLE books;--" as const;
