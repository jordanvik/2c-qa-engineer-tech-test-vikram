** Test plan — Book Library **

Application - Book Library (Next.js + in-memory API)
References - [README.md], [TECH_TEST_GUIDE.md]
Defect log - [BUGS_FOUND.md]
Automation - Playwright (`npm run test:e2e`), Vitest (`npm run test`) — see [TESTING.md](./TESTING.md) (security scope documented there)

---

# 1. Purpose

This document defines **what** will be tested, **how** success is judged, and **how** results map to automation and known defects. 

Formal TC matrices and traceability are in this plan. Test names are written to be self-descriptive — the test output is the readable walkthrough.

---

# 2. Objectives

- Verify **core user journeys**: browse library, open book details, add a book, return to library.
- Verify **HTTP API contracts** for `GET /api/books`, `GET /api/books/[id]`, and `POST /api/books` (status codes, payloads, required fields, error paths).
- Exercise **negative and edge** behaviour (invalid id, missing fields, boundary values) and record outcomes in [BUGS_FOUND.md](./BUGS_FOUND.md).
- **Formal penetration testing, DAST/SAST, and compliance certification** are out of scope; **targeted** API hygiene and stored-markup UI smoke are in scope (see §9a and [TESTING.md](./TESTING.md)).
- Provide **traceability** from planned scenarios to automated test files (filled in as specs land under `tests/`).

---

# 3. Scope

## 3.1 In scope


**Home** (`/`) - Loading state, list rendering, empty state, error + retry, link to Add Book, navigation to detail 
**Book detail** (`/book/[id]`) - Loading, success content, not found / error handling, back navigation 
**Add book** (`/add-book`) -  Form fields, HTML5 required fields, submit success path, error banner from API, cancel/back 
**API** -  `GET /api/books`, `GET /api/books/[id]`, `POST /api/books` per README |

## 3.2 Out of scope

Persistence after server restart - In-memory store by design |
Auth / roles - Not implemented 
Delete / edit book - Not implemented
Next.js dev overlay (“N” / Preferences) - Development tooling, not product UI 
Production-only performance SLAs 
**Performance tests** - No agreed SLAs; dev-env timing is noisy and misleading. Observations documented manually in BUGS_FOUND.md §BUG-013.
**WCAG / legal compliance certification** — Not claimed for the whole product. **Automated axe** on `/`, `/add-book`, book detail (`tests/accessibility/axe-wcag-aa-smoke.spec.ts`) attaches evidence; **serious/critical** gaps on home/detail are **BUG-015** with **`test.fail()`** until fixed ([BUGS_FOUND.md](./BUGS_FOUND.md)). |
**Pen test, DAST, SAST, rate limits, CSP, CORS, TLS** - Not exercised by this repo’s automation ([TESTING.md](./TESTING.md)) |
**Screen reader / keyboard-only full journeys** - not a substitute for assistive-tech QA

---

# 4. Assumptions and risks

| ID | Assumption / risk | Mitigation |
|----|-------------------|------------|
| R1 | Data is **in-memory**; ids depend on server state | Tests use stable assertions (e.g. known seed titles) or capture `id` from `POST` response |
| R2 | **React Strict Mode** in dev may double-invoke `useEffect` | Do not assert “exactly one” network call in browser; assert final UI state |
| R3 | **Turbopack** dev server and artificial API delays (100–200 ms) | Use Playwright auto-waiting assertions; avoid fixed sleeps except documented delays (e.g. post-add redirect) |
| R4 | Flaky CI if `webServer` and local dev both run | Prefer `reuseExistingServer` locally; CI uses clean server start |

---

# 5. Test environment

Node.js - 18+ (per README) 
App URL - `http://localhost:3000` (Playwright `baseURL` in `playwright.config.ts`) 
Browsers (E2E) -  Chromium, Firefox, WebKit (per Playwright projects)
Unit / component - Vitest + jsdom (`vitest.config.ts`) 

---

# 6. Entry and exit criteria

**Entry**

- Dependencies installed (`npm install`).
- Application reachable (dev server or Playwright-managed `webServer`).

**Exit (for this submission)**

- Critical **home** and **detail** journeys pass in automation **or** are explicitly waived with defect references.
- API contract checks documented and automated where agreed.
- Known defects listed in [BUGS_FOUND.md](./BUGS_FOUND.md) with severity.

---

# 7. Features under test (summary)

1. **Library list** — Fetches `/api/books`; displays cards with title, author, genre, year, pages, rating, description snippet; links to detail.
2. **Book detail** — Fetches `/api/books/:id`; shows full fields and actions (back, add another).
3. **Add book** — `POST /api/books`; success UI and redirect to new detail; validation and API errors surfaced.

---

# 8. UI test coverage matrix

| TC-ID | Feature | Scenario | Priority | Expected result | Known defects |
|-------|---------|----------|----------|-----------------|---------------|
| TC-UI-01 | Home | First load shows heading “Book Library” and seeded books | P1 | Content visible after load | — |
| TC-UI-02 | Home | “Add New Book” navigates to `/add-book` | P1 | Add form visible | — |
| TC-UI-03 | Home | Click book card opens `/book/{id}` with matching title | P1 | URL and heading match selected book | — |
| TC-UI-04 | Detail | “← Back to Library” returns to `/` | P1 | Home list visible | — |
| TC-UI-05 | Detail | Invalid id (e.g. non-existent numeric id) shows error / not found UX | P2 | User-safe message; link home | — |
| TC-UI-06 | Add book | Submit with only required title + author succeeds | P1 | Success state then detail for new id | — |
| TC-UI-07 | Add book | Empty required fields blocked by browser | P2 | Submit does not complete until filled | — |
| TC-UI-08 | Add book | Cancel returns to library | P2 | Home loads | — |
| TC-UI-09 | Add book | Rating decimal (e.g. 4.5) if UI allows step 0.1 | P2 | Stored value matches input | BUG-002 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-10 | Home | After failed load, “Try Again” when API recovers | P1 | List appears; error cleared | BUG-001 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-11 | Detail | After error on bad id, open valid book from library | P1 | Detail shows valid book | — |
| TC-UI-12 | Responsive | Key flows at narrow viewport (optional project) | P3 | No broken layout; primary actions reachable | — |

| TC-UI-13 | Add book | Pages field snaps back to 0 when cleared | P2 | Field should hold empty string to allow re-entry; clearing works without workaround | BUG-007 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-14 | Add book | Title/author/isbn/desc accept unlimited length text | P2 | UI enforces sensible max-length; oversized input rejected | BUG-008 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-15 | Add book | Pages field accepts arbitrarily large number (e.g. 9e+99) | P2 | UI enforces a max; out-of-range value rejected | BUG-009 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-16 | Add book | Rating up/down spinner arrows increment/decrement value | P2 | Value changes by 0.1 per click | BUG-010 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-17 | Add book | Author/title do not accept purely numeric or special-char-only values | P3 | Validation error shown; submit blocked | BUG-011 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-18 | Add book | Published Year set to next year (e.g. 2027) is rejected | P2 | Validation error shown; submit blocked for future dates | BUG-012 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-19 | Home | Load 20+ books — pagination controls appear | P2 | Page numbers / next-prev controls visible; only subset of books shown | BUG-013 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-UI-20 | Add book | Submit with Pages at default 0 is blocked by min=1 constraint | P2 | Form stays on /add-book; success screen not shown — **expected behaviour, not a bug** | — |
| TC-API-11 | API | POST with rating 9.9 (above max) should be rejected | P2 | 400 response; out-of-range rating refused | BUG-014 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-API-12 | API | POST with rating -1 (negative) should be rejected | P2 | 400 response; negative rating refused | BUG-014 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |

---

# 9. API test coverage matrix

| TC-ID | Endpoint | Scenario | Priority | Expected | Known defects |
|-------|----------|----------|----------|----------|---------------|
| TC-API-01 | `GET /api/books` | Happy path | P1 | `200`, JSON array, objects include `id`, `title`, `author` | — |
| TC-API-02 | `GET /api/books/{id}` | Existing id | P1 | `200`, single object, fields match README | — |
| TC-API-03 | `GET /api/books/{id}` | Unknown id | P1 | `404`, `{ error }` body | — |
| TC-API-04 | `GET /api/books/{id}` | Non-numeric id (e.g. `abc`) | P2 | `404` (no match) | — |
| TC-API-05 | `POST /api/books` | Valid minimal body (`title`, `author`) | P1 | `201`, body includes new `id` | — |
| TC-API-06 | `POST /api/books` | Missing `title` or `author` | P1 | `400`, error message | — |
| TC-API-07 | `POST /api/books` | Whitespace-only `title` and `author` | P2 | Ideally `400`; document if accepted | BUG-003 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-API-08 | `POST /api/books` | Invalid `pages` / `rating` / `publishedYear` (bypass UI) | P2 | Document contract: reject or accept | BUG-004 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-API-09 | `POST /api/books` | Malformed JSON body | P2 | `400`, clear error | BUG-005 ([BUGS_FOUND.md](./BUGS_FOUND.md)) |
| TC-API-13 | `GET /api/books/{segment}` | Fractional segment (e.g. `1.5`) | P3 | **`200`** — `parseInt` truncates; same body as `GET` for the truncated integer id when that book exists | — |
| TC-API-14 | `POST /api/books` | Extra JSON keys (`isAdmin`, etc.) | P2 | `201`; response JSON does **not** echo unknown keys | — |
| TC-API-15 | `POST` + `GET /api/books/{id}` | SQL-shaped strings in `title` / `description` | P3 | `201`; fields returned **verbatim** (in-memory store; documents absence of a SQL interpreter) | — |

---

## Note — Fractional and non-canonical `[id]` path segments (`GET /api/books/[id]`)

The route handler uses **`parseInt(id)`** on the path segment. That means:

- **`GET /api/books/1.5`** → `parseInt("1.5")` is **`1`** → response **`200`** with the same JSON as **`GET /api/books/1`** (seed Gatsby when id 1 is the first book).
- Similarly **`/book/9.99`** in the browser still shows **`9.99` in the URL**, but the client and API both resolve to **book id `9`** — the URL does not have to match the canonical integer id.

This is **implicit coercion by current implementation**, not strict “invalid id format” validation. It is easy to mistake for a defect; a stricter product rule might return **`400`** for segments that are not plain integers (e.g. only `^\d+$`). Until that is specified and implemented, automation treats the behaviour as **deterministic: fractional segment → truncated integer → `200` when that id exists**.

**Automation:** `tests/api/books-api-path-hygiene.spec.ts` (TC-API-13) asserts `200` and body `id` / title for `GET /api/books/1.5`. Non-numeric `abc` is **TC-API-04** in the same file.

---

## 9a. Security-related coverage (automated)

Injection-style probes: stored markup is checked in the browser; SQL-shaped literals are checked over HTTP (this demo app has **no** SQL database).

| TC-ID | Area | Scenario | Priority | Expected | Automation |
|-------|------|----------|----------|----------|------------|
| TC-SEC-01 | UI | Book title contains `<script>…`; detail page | P2 | Literal text; no `dialog`; XSS probe global unset | `stored-markup-injection.spec.ts` |
| TC-SEC-02 | UI | Book title contains `<img … onerror=…>`; detail page | P2 | Title shows markup as text; `onerror` does not set img probe global | `stored-markup-injection.spec.ts` |
| TC-SEC-03 | API | POST with SQL-shaped `title` / `description` | P3 | `201`; GET returns same strings unchanged | `books-api-injection-literals.spec.ts` |

---

## 9b. API repeated create (automated)

| TC-ID | Endpoint | Scenario | Priority | Expected | Automation |
|-------|----------|----------|----------|----------|------------|
| TC-API-10 | `POST /api/books` | Sequential creates (×10) with unique factory payloads | P3 | Each `201`; ten distinct `id` values | `books-api.spec.ts` |

---

# 10. Edge cases and negative testing

| Area | Case |
|------|------|
| Routing | `/book/0`, `/book/-1`, very large id |
| POST | Empty JSON `{}`, partial body, Unicode in title/description |
| POST | Duplicate ISBN (if product should enforce uniqueness — currently not required) |
| List | Empty array response (if API ever returns `[]`) — empty state copy |
| Concurrency | Double-submit add form (rapid clicks) — single book or duplicate entries |
| Concurrency | Many **parallel** `POST /api/books` — theoretical duplicate `id` if two handlers read same `max(id)` before push. Covered sequentially in `tests/api/books-api.spec.ts`; true parallel races need k6 or similar, out of scope. |

---

# 11. Traceability (automation map)

| TC-ID (see 8–9)  | Spec file | Playwright `describe` |
|------------------|-----------|------------------------|
| TC-UI-01 — TC-UI-05 | `tests/ui/book-library.spec.ts` | `Home + book detail routing` |
| TC-UI-10 (BUG-001), TC-UI-11 (guard) | `tests/ui/book-library.spec.ts` | `Error-state regression (BUG-001)` — `test.fail()` on Try Again only |
| TC-UI-04, TC-UI-06–07, TC-UI-08 | `tests/ui/add-book.spec.ts` | `Add book form (happy path)` · `Back / Cancel navigation` · `Add book form — negative paths` |
| TC-API-07 (UI layer, BUG-003) | `tests/ui/add-book.spec.ts` | `Add book form — negative paths` — `test.fail()` |
| TC-UI-12 (home + detail) | `tests/ui/book-library.spec.ts` | `Mobile layout — home and detail pages` |
| TC-UI-12 (add book form) | `tests/ui/add-book.spec.ts` | `Mobile layout — add book page` |
| TC-API-01 — TC-API-09 | `tests/api/books-api.spec.ts` | `Books API — contract` · `Books API — boundary & negative paths` |
| TC-API-10 | `tests/api/books-api.spec.ts` | `Books API — repeated creates` |
| TC-API-04, TC-API-13, TC-API-14 | `tests/api/books-api-path-hygiene.spec.ts` | `Books API — path segments & POST body hygiene` |
| TC-API-15 | `tests/api/books-api-injection-literals.spec.ts` | `Books API — injection-shaped literals (persistence)` |
| TC-SEC-01, TC-SEC-02 | `tests/security/stored-markup-injection.spec.ts` | `Detail page — stored markup (script)` · `Detail page — stored markup (img onerror)` |
| TC-SEC-03 | `tests/api/books-api-injection-literals.spec.ts` | `Books API — injection-shaped literals (persistence)` |
| TC-UI-13 — TC-UI-20 (BUG regressions) | `tests/ui/add-book-validation-bugs.spec.ts` | multiple `test.fail()` describes (one per BUG) |
| TC-E-12 / BUG-015 | `tests/accessibility/axe-wcag-aa-smoke.spec.ts` | `Accessibility — axe WCAG AA smoke` — `test.fail()` home + detail; attachments |
| TC-API-11, TC-API-12 (BUG-014) | `tests/api/books-api.spec.ts` | `Books API — boundary & negative paths` — `test.fail()` (ratings 9.9, -1, and -5 via `INVALID_API_PAYLOADS.ratingBelowMin`) |
| TC-API catalog after create | `tests/integration/books-api-create-verify-on-ui.spec.ts` | `POST then verify catalog` — new book appears on `GET /api/books` |
| API create → home + detail UI | `tests/integration/books-api-create-verify-on-ui.spec.ts` | `POST then verify on library UI` — card on `/`, title and author on `/book/[id]` |
| Unit (data layer) | `tests/unit/books-data.test.ts` | Vitest — `books-data` |
| Unit (Home component) | `tests/unit/home-page.test.tsx` | Vitest — `Home page — fetch states` |
| Unit (Detail component) | `tests/unit/book-detail-page.test.tsx` | Vitest — `Book detail page — fetch states` |
| Unit (Add Book component) | `tests/unit/add-book-page.test.tsx` | Vitest — `Add Book page` |

---

# 11a. Automation strategy — what to automate and what not to

Automated tests exist to catch regressions quickly and give fast feedback on critical paths. Not every scenario benefits from automation. This section records the deliberate decisions.

## Automate (high ROI)

| Category | Rationale |
|----------|-----------|
| Critical happy paths (home load, add book, detail view) | Regressions here break the primary user journey |
| Known bug regressions (**BUG-001**–**BUG-015**; **BUG-006** label mismatch is manual-only) | Ensure fixed bugs stay fixed; `test.fail()` until resolved |
| Accessibility axe WCAG AA smoke | `tests/accessibility/axe-wcag-aa-smoke.spec.ts` — `test.fail()` on routes with **BUG-015**; attachments for triage |
| API contract checks (status codes, required fields, error bodies) | Fast, stable |
| Boundary and negative inputs (whitespace, missing fields, oversized values) | Catches validation regressions |

## Do NOT automate (low ROI / wrong layer)

| Category | Rationale |
|----------|-----------|
| **Next.js “N” dev overlay behaviour** (theme, position, resize, hide, restart) | Development tooling, not product UI. Changes between Next.js versions. High maintenance, zero user value. Document as manual observations only. |
| **Dev overlay theme dropdown click-target quirk** (arrow vs text label) | third-party dev tool; not a product regression risk. |
| **Full WCAG manual audit + assistive-tech sign-off** | Automated axe (serious/critical gate) is a **smoke** layer only; it does not replace keyboard-only journeys, screen readers, or legal WCAG certification. |
| **Load / performance SLAs** | Dev environment has artificial delays; meaningful SLAs require a stable prod-like environment. |
| **In-memory persistence behaviour** | By design; not a regression surface. |
| Every cosmetic / copy variant | Brittle selectors, high churn, rarely signals a real bug. |
| **Performance tests (timing budgets)** | No SLAs defined. Dev-env timings are noisy (Turbopack cold start, artificial delays). Only meaningful against a stable production build with agreed thresholds. |

> **Principle:** automate the tests that are (a) stable enough to run in CI without false positives, (b) fast to run, and (c) guard against high-impact regressions. Everything else is faster and more reliable as a targeted manual check.

---

# 12a. Bug automation coverage audit

Every logged bug is assessed here for automation.

| Bug | Severity | Automated? | Test file | Notes |
|-----|----------|------------|-----------|-------|
| BUG-001 | High | ✅ `test.fail()` | `tests/ui/book-library.spec.ts` | Try Again leaves error banner; remove `test.fail()` when fixed |
| BUG-002 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-16c | Decimal rating truncated (`parseInt`) |
| BUG-003 | Med | ✅ `test.fail()` | `tests/api/books-api.spec.ts` + `tests/ui/add-book.spec.ts` | Whitespace-only title/author accepted |
| BUG-004 | Med | ✅ `test.fail()` | `tests/api/books-api.spec.ts` | Invalid `pages` / `rating` / `publishedYear` accepted server-side |
| BUG-005 | Low | ✅ documents behaviour | `tests/api/books-api.spec.ts` | Malformed JSON → 400; generic error message |
| BUG-006 | Low | ❌ **Intentionally not automated** | — | Label “Rating (1–5)” vs `min="0"` — cosmetic |
| BUG-007 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-13 | Pages field snaps back to 0 when cleared |
| BUG-008 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-14 | No max-length on text fields |
| BUG-009 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-15 | No upper bound on Pages |
| BUG-010 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-16a/b | Rating spinner arrows broken |
| BUG-011 | Low | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-17 | Author/title format validation |
| BUG-012 | Low | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-18 | Published Year allows future dates |
| BUG-013 | Med | ✅ `test.fail()` | `tests/ui/add-book-validation-bugs.spec.ts` TC-UI-19 | No pagination on home (mocked 20 books) |
| BUG-014 | Low | ✅ `test.fail()` | `tests/api/books-api.spec.ts` TC-API-11/12 + negative -5 payload | Out-of-range API ratings stored verbatim |
| BUG-015 | Med | ✅ `test.fail()` | `tests/accessibility/axe-wcag-aa-smoke.spec.ts` | WCAG colour-contrast on home + detail |

**Summary:** Every logged defect except **BUG-006** (label copy) has automation: `test.fail()`, documented API checks, or (**BUG-015**) axe evidence + expected failure until the UI is fixed.

---

# 12. Defect management

- **Log:** All confirmed issues: [BUGS_FOUND.md](./BUGS_FOUND.md).  
- **Workflow:** New finding → add row to summary + detail section; link TC-ID; set status **Open** / **Fixed** / **Won’t fix**.  
- **Severity:** High = broken primary journey or data integrity; Medium = validation / misleading UX; Low = cosmetic or rare edge case.

---

# 13. Sign-off (optional)

| Role | Name | Date | Notes |
|------|------|------|-------|
| Tester | | | |
| Automation | | | |

---

# Revision history

| Version | Date | Changes |
|---------|------|----------|
| 1.0 | 2026-04-21 | Initial structured test plan |

| 1.1 | 2026-04-22 | Linked defects and TC matrix to BUGS_FOUND |
| 1.2 | 2026-04-22 | TEST_SCENARIOS.md catalogue; scenario standard (file later removed — test names made self-descriptive) |

| 1.3 | 2026-04-23 | Repeated create TC-API-10; edge matrix note on parallel POST |
| 1.4 | 2026-04-23 | Add book happy path unblocked (pages `min=1` expected behaviour); UI negative paths; unit tests deepened; spec paths corrected |
| 1.5 | 2026-04-23 | Pages field snap-back logged; TC-UI-13 added |
| 1.6 | 2026-04-23 | Add-book exploratory defects; TC-UI-14–17 added |
| 1.7 | 2026-04-23 | N button observations documented; automation strategy section (11a) added; further add-book + home defects; TC-UI-18–19 |
| 1.8 | 2026-04-23 | API rating-range gap logged; coverage audit 12a added; TC-UI-20–21; related API/UI tests added |
| 1.9 | 2026-04-23 | Note on fractional `GET /api/books/[id]` (`parseInt` truncation);
| 1.10 | 2026-04-23 | Rating -5 POST: passing test → `test.fail()`; traceability / BUG audit updated |
| 1.11 | 2026-04-23 | Integration: POST via API then assert book on home library and detail page (`POST then verify on library UI`) |
| 1.12 | 2026-04-23 | Scope wording (security vs pen-test); Playwright trace `retain-on-failure` globally; spec inventory / overlap notes in TESTING.md; CI YAML documents trace artifacts |
| 1.13 | 2026-04-23 | `tests/accessibility/` + WCAG AA axe **merge gate** (serious/critical); UI contrast defect logged; home + detail axe checks use **`test.fail()`**; add-book stays strict pass |
| 1.14 | 2026-04-23 | Defect log renumbered **BUG-001**–**BUG-015** after removing retired / hypothetical entries; matrices, traceability, and spec annotations aligned |

