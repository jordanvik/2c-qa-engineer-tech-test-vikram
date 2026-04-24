# Bug log — Book Library (manual / code review)

## Summary

| ID      | Severity | Area        | Title (short)                                      |
|---------|----------|-------------|-----------------------------------------------------|
| BUG-001 | **High** | Home / UI   | Error screen persists after successful “Try Again” |
| BUG-002 | **Med**  | Add book    | Decimal ratings broken (`parseInt` vs `step`)     |
| BUG-003 | **Med**  | API         | POST accepts whitespace-only title/author         |
| BUG-004 | **Med**  | API         | POST accepts invalid numeric domain values        |
| BUG-005 | **Low**  | API         | Generic “Invalid JSON” for all POST failures      |
| BUG-006 | **Low**  | Add book    | Label “Rating (1–5)” vs `min="0"`                 |
| BUG-007 | **Med**  | Add book    | Pages field cannot be cleared — snaps back to 0   |
| BUG-008 | **Med**  | Add book    | No max-length on title, author, ISBN, description  |
| BUG-009 | **Med**  | Add book    | Pages field has no upper bound (accepts 1.09e+217) |
| BUG-010 | **Med**  | Add book    | Rating spinner arrows non-functional (parseInt)    |
| BUG-011 | **Low**  | Add book    | Title/author accept leading numbers & special chars|
| BUG-012 | **Low**  | Add book    | Published Year allows future dates (e.g. 2027)     |
| BUG-013 | **Med**  | Home / UI   | No pagination — all books rendered in one list      |
| BUG-014 | **Low**  | API        | Out-of-range ratings accepted and stored verbatim (no server validation) |
| BUG-015 | **Med**  | Home / Detail | Rating UI fails WCAG colour-contrast (axe serious) — `test.fail()` until fixed |

---

## BUG-001 — Home “Try Again” leaves user on error after a successful fetch

**Severity:** High (blocks recovery path)  
**Component:** `src/app/page.tsx`

### Reproduction

1. Simulate or cause `/api/books` to fail (e.g. stop server briefly, or block request in DevTools).  
2. Observe error UI with “Try Again”.  
3. Restore server; click **Try Again**.

### Expected

Library list loads; error UI disappears.

### Actual

`setBooks(data)` runs on success, but **`setError(null)` is never called**. After `loading` becomes `false`, render still hits `if (error)` first and keeps showing the error screen.

### Code reference

`fetchBooks` sets `setError` only in `catch`, never clears on success (`src/app/page.tsx`).

---

## BUG-002 — Rating field: decimals advertised but truncated in state

**Severity:** Medium (data integrity / misleading UI)  
**Component:** `src/app/add-book/page.tsx`

### Reproduction

1. Go to **Add New Book**.  
2. Set rating to **4.5** (field has `step="0.1"`).

### Expected

Submitted payload (or displayed behaviour) preserves **4.5** (or UI does not imply decimals if unsupported).

### Actual

`handleInputChange` uses **`parseInt`** for `rating`, so values become **integers** (e.g. 4.5 → 4). Conflicts with `step="0.1"` and user expectation of fractional ratings.

### Code reference

```28:30:src/app/add-book/page.tsx
      [name]: name === 'publishedYear' || name === 'pages' || name === 'rating' 
        ? parseInt(value) || 0 
        : value
```

---

## BUG-003 — POST `/api/books` accepts whitespace-only “required” fields

**Severity:** Medium (validation gap vs real-world rules)  
**Component:** `src/app/api/books/route.ts`

### Reproduction

Send POST with JSON: `"title": "   "`, `"author": "   "` (spaces only).

### Expected

400 and clear validation message (treat as empty after trim).

### Actual

`!body.title` is **false** for non-empty strings of spaces → book is created.

### Code reference

```16:21:src/app/api/books/route.ts
    if (!body.title || !body.author) {
      return NextResponse.json(
        { error: 'Title and author are required' },
        { status: 400 }
      );
    }
```

---

## BUG-004 — POST accepts nonsensical `pages`, `rating`, `publishedYear`

**Severity:** Medium (API contract / data quality)  
**Component:** `src/app/api/books/route.ts`

### Reproduction

POST valid JSON with e.g. `"pages": -1`, `"rating": 99`, `"publishedYear": 99999` (bypassing browser-only `min`/`max` on the form).

### Expected

400 or normalised bounds per product rules.

### Actual

Values are passed through (with `||` defaults only for falsy fields); **no server-side range validation**.

**Confirmed by direct API test (2026-04-23):**

| Sent `rating` | Stored `rating` | HTTP status | Observation |
|---|---|---|---|
| `9.9` | `9.9` | `201` | Accepted — exceeds documented 1–5 scale |
| `-1` | `-1` | `201` | Accepted — negative rating stored verbatim |
| `3.5` | `3.5` | `201` | Accepted — decimal stored correctly (no truncation at API layer) |

The third row also **confirms BUG-002 / BUG-010 are purely UI-layer bugs**: the API handles decimal ratings correctly. The `parseInt` truncation only occurs inside `handleInputChange` in the form. Seed data and direct API posts preserve fractional ratings without any issue.

Although the UI correctly blocks `pages: 0` on the form (`min="1"`), the **API** still accepts `pages: 0` and `pages: -1` without validation — covered by `test.fail()` in `tests/api/books-api.spec.ts`.

### Code reference

`addBook({ ... pages: body.pages || 0, rating: body.rating || 0 ... })` (`src/app/api/books/route.ts`).

---

## BUG-005 — POST error handler always returns “Invalid JSON”

**Severity:** Low (misleading diagnostics)  
**Component:** `src/app/api/books/route.ts`

### Reproduction

Any thrown error inside `POST` (not only malformed JSON).

### Expected

Distinct messages for invalid JSON vs other server errors (or 500 with safe body).

### Actual

`catch` returns `{ error: 'Invalid JSON' }` for **all** exceptions.

### Code reference

```39:44:src/app/api/books/route.ts
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
```

---

## BUG-006 — Rating label vs minimum value inconsistent

**Severity:** Low (copy / validation mismatch)  
**Component:** `src/app/add-book/page.tsx`

### Reproduction

Read label “Rating **(1–5)**” and note input **`min="0"`**.

### Expected

Label matches allowed range (either allow 0–5 in copy or enforce 1–5).

### Actual

User can submit **0** while label implies 1–5 scale.

---

## BUG-007 — Pages field cannot be cleared: snaps back to 0



**Severity:** Medium (poor UX; user cannot enter a blank/empty page count without a workaround)  

**Component:** `src/app/add-book/page.tsx`



### Reproduction



1. Open **Add New Book** (`/add-book`).

2. Click into the **Pages** field (default value is `0`).

3. Select all and press **Delete** or **Backspace** to clear it.



### Expected



Field clears to empty, allowing the user to type a fresh value.



### Actual



The field immediately snaps back to **`0`**. The user cannot clear it directly; they must first type a new digit to override the value.



### Root cause



`handleInputChange` parses numeric fields with `parseInt(value) || 0`. When the field is fully cleared, `value` is an empty string, `parseInt('')` returns `NaN`, and `NaN || 0` resolves to `0` — which React immediately writes back into the controlled input.



```28:31:src/app/add-book/page.tsx

      [name]: name === 'publishedYear' || name === 'pages' || name === 'rating'

        ? parseInt(value) || 0

        : value

```



### Suggested fix



Allow the field to hold an empty string transiently while the user is typing, and only coerce to a number on blur or on submit. Alternatively, use `value === '' ? '' : parseInt(value)` so React does not force a repaint to `0` mid-edit.



---



## BUG-008 — No maximum-length validation on free-text input fields



**Severity:** Medium (data quality / UX degradation; confirmed by screenshot showing title and author rendered as overflowing single-line strings)

**Component:** `src/app/add-book/page.tsx`, `src/app/api/books/route.ts`



### Reproduction



1. Open **Add New Book** (`/add-book`).

2. In **Title**, paste an arbitrarily long string (e.g. 200+ characters).

3. Do the same for **Author**, **ISBN**, and **Description**.

4. Submit the form.



### Expected



UI enforces a sensible maximum length (e.g. title ≤ 255 chars, author ≤ 100 chars) and/or the API rejects oversized values.



### Actual



No `maxlength` attribute on any text input; no server-side length check in `POST /api/books`. Arbitrarily long strings are accepted and stored, causing overflowing layout on the detail page (screenshot: title and author lines overflow the card boundary).



### Code reference



Title input has no `maxLength` prop (`src/app/add-book/page.tsx` lines 109–118); same for author (130–135), ISBN (204–212), description textarea (237–246). API route performs no length checks.



---



## BUG-009 — Pages field has no upper bound — accepts scientific-notation values



**Severity:** Medium (data integrity; confirmed by screenshot showing “1.09e+217 pages” on detail page)

**Component:** `src/app/add-book/page.tsx`, `src/app/api/books/route.ts`



### Reproduction



1. Open **Add New Book**.

2. Enter an extremely large number in **Pages** (e.g. type `9` repeatedly or paste `999999999999999999999999`).

3. Submit.



### Expected



UI enforces a sensible `max` (e.g. 50 000) and/or the API rejects out-of-range values.



### Actual



The Pages `<input type="number">` has `min="1"` but **no `max` attribute**. JavaScript Number precision issues allow values like `1.09e+217` to be accepted and displayed verbatim on the detail page. Related to BUG-004 (no server-side range check) but this is the missing UI-layer guard.



### Code reference



Pages input at `src/app/add-book/page.tsx` lines 187–196: `min="1"` present, `max` absent. API route passes `body.pages` directly with no upper-bound check.



---



## BUG-010 — Rating spinner arrows non-functional; pages/year arrows unaffected



**Severity:** Medium (unusable native control; confirmed by screenshot of circled spinner)

**Component:** `src/app/add-book/page.tsx`

**Related:** BUG-002 (same root cause — `parseInt` instead of `parseFloat`)



### Reproduction



1. Open **Add New Book**.

2. Click the **up arrow** on the Rating spinner repeatedly.



### Expected



Rating increments by `0.1` per click (field declares `step="0.1"`).



### Actual



`parseInt` truncates every decimal value, causing two distinct behaviours depending on arrow direction:

**Up arrow — completely non-functional:**  
Each click adds `0.1` to the current integer value (e.g. `1` → `1.1`), but `parseInt("1.1") = 1`, so the state never changes. The field appears completely stuck regardless of how many times the up arrow is clicked.

**Down arrow — partially functional but wrong step size:**  
Each click subtracts `0.1` from the current value (e.g. `2` → `1.9`), and `parseInt("1.9") = 1`, so the state jumps by `-1` instead of `-0.1`. The down arrow appears to work but with an effective integer step, not the declared `step="0.1"`.

**Typing a decimal (e.g. `4.5`):**  
As the user types `4.5`, `onChange` fires with `"4.5"` → `parseInt("4.5") = 4` → state snaps back to `4`. The decimal part is lost before the user finishes typing (screenshot confirms `"4."` mid-type before React re-renders to `4`).



### Code reference



```28:31:src/app/add-book/page.tsx

      [name]: name === 'publishedYear' || name === 'pages' || name === 'rating'

        ? parseInt(value) || 0

        : value

```



**Fix direction:** Replace `parseInt` with `parseFloat` for `rating`, keeping `parseInt` only for `publishedYear` and `pages`.

### Why pages and year arrows are unaffected

`parseInt` only truncates when the input contains a fractional part. Pages and Published Year use the browser default `step="1"`, so every arrow click produces an integer value (e.g. `101`, `2025`). `parseInt(101) = 101` — no truncation, no visible bug. Rating is the **only** field with `step="0.1"`, making it the only field where `parseInt` causes observable breakage. This was confirmed by direct testing: pages and published year arrows behave correctly while rating arrows do not.



---



## BUG-011 — Author and title fields accept leading numbers and special characters



**Severity:** Low (data quality; confirmed by screenshots showing title “8283042”, author “43242342342”, and title/author “--------”)

**Component:** `src/app/add-book/page.tsx`, `src/app/api/books/route.ts`



### Reproduction



1. Open **Add New Book**.

2. Enter a purely numeric string (e.g. `8283042`) in **Title** or **Author**.

3. Enter a special-character-only string (e.g. `--------`) in **Title** or **Author**.

4. Submit the form.



### Expected



At minimum, **Author** should require at least one alphabetic character (a name cannot reasonably be a number). **Title** accepting numbers is debatable but special-character-only strings should be flagged. A format validation message should be shown before submit.



### Actual



No `pattern` attribute or JavaScript validation prevents numeric-only or special-character-only values. Both fields accept and store any string that is non-empty and non-whitespace (whitespace-only is a separate gap — BUG-003).



### Code reference



Title and author `<input type="text">` have only `required` — no `pattern` or custom validation (`src/app/add-book/page.tsx` lines 109–135). API route checks only `!body.title || !body.author`.



---



## BUG-012 — Published Year field allows future dates

**Severity:** Low (data quality; confirmed by screenshot showing Published Year: 2027)
**Component:** `src/app/add-book/page.tsx`

### Reproduction

1. Open **Add New Book** (`/add-book`).
2. Set **Published Year** to any year beyond the current year (e.g. `2027`).
3. Submit the form.

### Expected

Published Year should not exceed the current year (books cannot have been published in the future). The UI should reject or warn on years > `new Date().getFullYear()`.

### Actual

The input uses `max={new Date().getFullYear() + 1}`, so the browser allows up to one year ahead (e.g. 2027 when today is 2026). The book is created and the detail page displays the future year with no warning.

### Code reference

Published Year input at `src/app/add-book/page.tsx` line 177: `max={new Date().getFullYear() + 1}`. Changing `+ 1` to `+ 0` would restrict to the current year.

---

## BUG-013 — No pagination on home page — all books rendered in one unbounded list

**Severity:** Medium (scalability / UX; missing feature rather than a code defect, but impacts usability as the catalog grows)
**Component:** `src/app/page.tsx`, `src/app/api/books/route.ts`

### Reproduction

1. Add 20+ books via the form or API.
2. Open the home page (`/`).

### Expected

Pagination controls (page numbers, next/prev), infinite scroll, or a "Load more" button limit the visible set. Long lists should not cause the page to grow unboundedly.

### Actual

The `GET /api/books` endpoint returns the entire in-memory array with no `limit`/`offset` parameters. The home page renders every book card in one flat list with no pagination UI at all.

### Code reference

`src/app/page.tsx` — `fetchBooks()` calls `/api/books` and passes the full array directly to `setBooks(data)`. No slice, no pagination state.

### Performance impact observed (2026-04-23)

With 55 books in the in-memory store (5 seed + 50 added via API), dev-server response times for `GET /api/books` were measured at **730 ms** and **573 ms** (two calls due to React Strict Mode). The endpoint has an artificial `100 ms` delay, so the remaining **630 ms / 473 ms** is serialisation and transfer overhead for the full array.

| Books in store | Observed response time | Overhead above 100 ms baseline |
|---|---|---|
| 5 (seed only) | ~100–150 ms (expected) | ~0–50 ms |
| 55 (seed + 50 API adds) | 730 ms / 573 ms | ~473–630 ms |

Response time grows with catalog size because every request returns the **entire array** with no `limit`/`offset`. This makes pagination a performance requirement, not just a UX nicety.

**React Strict Mode double-invoke:** The two `GET /api/books` calls visible in the terminal are expected in development (R2 risk in TEST_PLAN.md §4). Production would make a single call.

---

## BUG-014 — API accepts out-of-range rating values without validation

**Severity:** Low (data integrity; only reachable by bypassing the form and posting directly to the API)
**Component:** `src/app/api/books/route.ts`
**Related:** BUG-004 (same missing server-side range checks)

### Reproduction

1. POST a book with `rating: 9.9` (above the documented 1–5 scale) via the API.
2. POST a book with `rating: -1` (negative) via the API.

### Expected

Both requests should be rejected with **400** and a clear validation message (e.g. `"rating must be between 0 and 5"`).

### Actual (confirmed by direct API test, 2026-04-23)

| Sent `rating` | HTTP status | Stored value | Observation |
|---|---|---|---|
| `9.9` | `201` | `9.9` | Accepted — exceeds documented 1–5 scale |
| `-1` | `201` | `-1` | Accepted — negative rating stored verbatim |

The UI form does apply `min="0" max="5"` client-side constraints, so out-of-range values **cannot be submitted through the form**. The gap is purely at the **API layer** — the server must not trust that all callers go through the UI.

### Code reference

`addBook({ ... rating: body.rating || 0 ... })` in `src/app/api/books/route.ts` applies no range validation on `rating`.

### Fix direction

Add server-side validation in the POST handler: reject any `rating` outside `0–5` with a `400` response before calling `addBook`.

---

## BUG-015 — Rating and star affordances: insufficient colour contrast (WCAG)

**Severity:** Medium (barrier for low vision; axe `serious` `color-contrast`)  
**Status:** **Open** — tracked in automation with Playwright **`test.fail()`** (same pattern as BUG-003 / BUG-007: we document the gap and keep CI green until product fixes land).  
**Components:** `src/app/page.tsx` (book cards), `src/app/book/[id]/page.tsx` (header rating + star row)

### Automation

`tests/accessibility/axe-wcag-aa-smoke.spec.ts` — **home** and **book detail** tests are wrapped in **`test.fail()`** while this bug is open. Each run still attaches **`axe-*-violations.json`** / summaries to the HTML / Allure report for triage. The **add book** route is a normal assertion (currently clean under the same rule set).

### Reproduction

1. `npx playwright test tests/accessibility/axe-wcag-aa-smoke.spec.ts --project=chromium`
2. Open report → attachments → `axe-home-violations.json` or `axe-book-detail-violations.json`
3. Inspect `id: "color-contrast"` — yellow rating / stars on white (~`text-yellow-400` / `text-yellow-500`) below WCAG 2 AA contrast for the text role axe applies.

### Expected

Numeric rating (and any non-decorative text conveying the same) meets **4.5:1** (normal) or **3:1** (large text) vs background; decorative stars may use `aria-hidden` if contrast cannot be met on glyphs alone.

### Actual

axe reports **serious** `color-contrast` on home and detail with current styling.

### Fix direction (product — out of scope for the test submission unless you choose to implement)

Darken rating text, change surface (e.g. pill background), or mark purely decorative stars `aria-hidden` and expose rating in high-contrast copy + accessible name.

### Note

We **do not** have to “fix” accessibility inside the QA test repo: the **standard approach here** is to **log the defect**, **attach evidence**, and use **`test.fail()`** until development resolves it — identical in spirit to other open bugs in this file.

---

## Manual test cases (quick matrix) — for `TEST_PLAN.md` traceability

| TC-ID   | Area   | Scenario                                      | Linked defect |
|---------|--------|-----------------------------------------------|----------------|
| TC-H-01 | Home   | First load shows seeded books                 | —              |
| TC-H-02 | Nav    | Card → detail URL matches book                | —              |
| TC-H-03 | Add    | Title + author → success → redirect detail    | —              |
| TC-E-01 | Home   | Retry after API failure                       | **BUG-001**    |
| TC-E-02 | Detail | Invalid id → then valid id                    | —              |
| TC-E-03 | Add    | Rating 4.5                                    | **BUG-002**    |
| TC-E-04 | API    | POST whitespace title/author                  | **BUG-003**    |
| TC-E-05 | API    | POST extreme `rating` / `pages`               | **BUG-004**    |
| TC-E-06 | Add    | Paste 300-char string in title/author/isbn/desc  | **BUG-008**    |
| TC-E-07 | Add    | Enter huge number in pages field                 | **BUG-009**    |
| TC-E-08 | Add    | Click rating up/down spinner arrows              | **BUG-010**    |
| TC-E-09 | Add    | Numeric-only and special-char-only author/title  | **BUG-011**    |
| TC-E-10 | Add    | Submit with Published Year set to next year      | **BUG-012**    |
| TC-E-11 | Home   | Load 20+ books — verify pagination controls appear | **BUG-013**    |
| TC-E-12 | A11y   | Run `tests/accessibility/axe-wcag-aa-smoke.spec.ts`; review axe JSON; expect `test.fail()` on home/detail until **BUG-015** fixed | **BUG-015**    |

---

## Out of scope / not defects (document in test plan)

- **Next.js “N” dev overlay / Preferences** — development tooling, not product UI. See observations below.  
- **Multiple `GET` lines in Network** — often Strict Mode double-invoke or prefetch; not automatically a product bug.  
- **In-memory data lost on server restart** — documented architecture for this tech test.

### N button (Next.js dev overlay) — manual observations (not product bugs, not automated)

| Behaviour | Observed result | Automate? |
|-----------|-----------------|----------|
| Theme dropdown — click **text** (Dark / Light / System) | Theme of overlay changes correctly | No — dev tooling |
| Theme dropdown — click **arrow icon or field border** | No response; only text label is clickable | No — dev tooling quirk, not a product bug |
| Theme scope | Applies only to the N overlay popup itself, **not** to the application UI | No — expected dev tool behaviour |
| Position (Bottom Right / Bottom Left / Top Left / Top Right) | Moves overlay correctly for all four options | No — dev tooling |
| Resize (Small / Medium / Large) | Overlay resizes correctly for all options | No — dev tooling |
| Hide Dev Tools / Restart Dev Server | Both controls work as expected | No — dev tooling |

---

## Next steps 

1. Will keep this file updated: **Open / Fixed / Won’t fix** + PR link per bug.  

