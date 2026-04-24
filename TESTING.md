# Testing guide

This file explains **how to run** automated tests, **what they cover**, and where to find **plans and defects**. For strategy and coverage matrices, see [TEST_PLAN.md](./TEST_PLAN.md). For logged bugs, see [BUGS_FOUND.md](./BUGS_FOUND.md). Test names are written to be self-descriptive — run the suite and read the output to understand what each check covers.

---

## Prerequisites

- **Node.js** 18 or newer  
- **npm** (comes with Node)  
- Dependencies installed from the repo root:

  ```bash
  npm install
  ```

- **Playwright browsers** (first time only):

  ```bash
  npx playwright install
  ```

---

## What is automated

Tests are grouped by concern under `tests/`:

```
tests/
├── ui/             Browser E2E — product journeys: home, navigation, add-book, responsive, bug regressions
├── accessibility/ Automated axe WCAG AA smoke (browser) — **not** user-journey UI tests
├── api/            HTTP contract, path hygiene, injection literals, repeated-create
├── security/       Stored-markup injection smoke (browser)
├── integration/    Cross-cutting: POST via API → verify `GET /api/books` and/or home + detail UI
├── unit/           Vitest component + data-layer tests (mocked fetch)
└── support/        Shared infrastructure (not specs)
    ├── clients/    BooksApiClient (raw request, no assertions)
    ├── data/       Seed constants + payload factory
    ├── fixtures/   Playwright fixtures + index re-export
    ├── helpers/    Shared assertions and route interceptors
    ├── pages/      Page Object Models (BasePage, Home, Detail, AddBook)
    └── workflows/  SubmitNewBookFormWorkflow
```

| Layer | Tool | Location | Purpose |
|-------|------|----------|---------|
| **Unit / component** | Vitest | `tests/unit/` | Component render + fetch-mock tests; data-layer helpers |
| **UI E2E** | Playwright | `tests/ui/` | Product browser journeys, form flows, responsive layout |
| **Accessibility** | Playwright | `tests/accessibility/` | axe-core scans + JSON attachments; **BUG-015** backed by **`test.fail()`** (no product fix required in this repo) |
| **API** | Playwright | `tests/api/` | Contract, boundaries, path coercion, SQL-shaped literals, volume |
| **Security** | Playwright | `tests/security/` | Stored-markup probes (`<script>`, `<img onerror>`) on the book detail page |
| **Integration** | Playwright | `tests/integration/` | POST via API → assert catalog JSON **or** same book on home + detail in the browser |
| **Support** | — | `tests/support/` | POMs, client, data factories, helpers, fixtures |
| **Tags** | Playwright | `tag` on each `test.describe` | Filter: `npx playwright test --grep @api` — see **Tags** below |

Exact spec files evolve with the branch; align names with the **Traceability** table in [TEST_PLAN.md](./TEST_PLAN.md).

### Why `tests/accessibility/` is not under `tests/ui/`

**Separation of concerns:** `tests/ui/` holds **behavioural / journey** checks (what the user does and what the app should do). `tests/accessibility/` holds **cross-cutting quality rules** (axe WCAG rules engine on stable URLs). Same browser stack, different intent — mirroring how many teams split **E2E features** from **a11y / compliance** suites. **`tests/security/`** follows the same idea for injection-style checks.

---

## Playwright spec inventory (no accidental duplication)

Each file below is the **only** place its primary scenarios live. Where two files both `POST /api/books`, they assert **different surfaces** (see **Intentional overlap**).

| Spec | `test.describe` tags (typical) | What it proves |
|------|-------------------------------|----------------|
| `tests/api/books-api.spec.ts` | `@api` `@contract` / `@api` `@boundary` / `@api` `@repeat` | List + seed; POST→GET field parity; 404 unknown id; required-field and malformed JSON failures; `test.fail()` for open BUGs; ten sequential creates |
| `tests/api/books-api-path-hygiene.spec.ts` | `@api` `@boundary` | `GET …/1.5`, `GET …/abc`, POST extra keys not echoed |
| `tests/api/books-api-injection-literals.spec.ts` | `@api` `@security` | SQL-shaped title/description stored and returned verbatim |
| `tests/integration/books-api-create-verify-on-ui.spec.ts` | `@api` `@integration` / `@integration` `@ui` | POST then row on `GET /api/books` JSON; POST then card + detail **in the browser** |
| `tests/security/stored-markup-injection.spec.ts` | `@ui` `@security` | POST with probe title → detail shows literal markup; no `dialog` / probe globals |
| `tests/ui/book-library.spec.ts` | `@ui` `@smoke` / `@ui` `@regression` / `@ui` `@responsive` | Home and detail routing, error retries, mobile layout |
| `tests/ui/add-book.spec.ts` | `@ui` `@add-book` | Happy path submit, cancel, field validation, responsive form |
| `tests/ui/add-book-validation-bugs.spec.ts` | `@ui` `@add-book` `@bug` | One `test.fail()` block per open add-book / home defect (**BUG-002**–**BUG-013**) |
| `tests/accessibility/axe-wcag-aa-smoke.spec.ts` | `@accessibility` `@a11y` `@bug` | axe on `/`, `/add-book`, `/book/1`; **home + detail** use `test.fail()` while **BUG-015** open; add-book strict pass; JSON attachments |

### Intentional overlap (not duplicates)

- **`books-api.spec.ts` POST→GET** checks **every field** on a normal literature payload. **`books-api-injection-literals.spec.ts`** checks **only** SQL-shaped title/description. **`stored-markup-injection.spec.ts`** checks **rendering**, not JSON parity.
- **`integration` UI test** and **`add-book` happy path** both end on detail with title/author: the first **creates via HTTP** (skips the form); the second **exercises the form** and client redirect — different layers.
- **`book-library.spec.ts`** uses the **real dev API** and seed data; **`tests/unit/*Page*.tsx`** mock **`fetch`** for the same routes — **unit = fast component contract**, **Playwright UI = full stack**.

### Vitest (`tests/unit/`)

| File | Focus |
|------|--------|
| `books-data.test.ts` | In-memory data helpers |
| `home-page.test.tsx`, `book-detail-page.test.tsx`, `add-book-page.test.tsx` | Render states with mocked fetch (overlaps *themes* with Playwright UI, not the same assertions) |

---

## Security testing — scope and rules

### Scope (what we automate)

| Area | Spec file(s) | Intent |
|------|----------------|--------|
| **Path coercion & POST hygiene** | `tests/api/books-api-path-hygiene.spec.ts` | Fractional `GET` segment (`parseInt` truncation), non-numeric id → `404`, POST with **extra keys** not echoed in JSON |
| **Injection-shaped literals (HTTP)** | `tests/api/books-api-injection-literals.spec.ts` | SQL-style strings in `title` / `description` stored and returned verbatim (`@security` tag for filtered runs) |
| **Stored string rendering (markup smoke)** | `tests/security/stored-markup-injection.spec.ts` | Book created with **script-like** or **img onerror** title; detail page must not execute probes or fire `dialog` |
| **API contracts & validation** | `tests/api/books-api.spec.ts` | Status codes, required fields, malformed body behaviour |

### Rules (how we interpret results)

- Tests document **actual** API behaviour where the product is permissive (e.g. id path coercion); tightening the API is a **product change**, not a silent test change — update spec + plan together.
- **No authentication** in this app — we **do not** claim IDOR, session, or privilege tests.
- **Stored markup:** We assert React’s default text rendering for **script** and **img onerror** title probes; we **do not** fuzz all fields or all vectors (SVG, CSS, `javascript:` URLs, etc.).
- **SQL-shaped input:** The app has **no SQL engine**; the API test documents that strings are persisted literally (regression guard if a DB layer is ever introduced incorrectly).

### Out of scope (explicit)

- **Penetration testing**, **DAST** on a deployed environment, **SAST** of the full dependency tree.
- **Rate limiting**, **CORS**, **CSP**, **cookie flags**, **TLS** — infrastructure / deployment concerns unless added to the app under test.
- **Secrets leakage**, **PII** handling — not applicable to this in-memory demo.
- **Business-logic fraud** beyond what the API exposes (e.g. no payment flows).

Defects that overlap security and functional behaviour remain in [BUGS_FOUND.md](./BUGS_FOUND.md).

---

## Commands

Run all commands from the **repository root**.

| Goal | Command |
|------|---------|
| **Unit tests (Vitest)** | `npm run test` |
| **Unit tests, single run (CI-style)** | `npx vitest run` |
| **Unit tests with coverage** | `npm run test:coverage` |
| **E2E (Playwright)** | `npm run test:e2e` |
| **E2E — UI mode** | `npx playwright test --ui` |
| **E2E — one project (e.g. Chromium only)** | `npx playwright test --project=chromium` |
| **Lint** | `npm run lint` |
| **Generate Allure report** | `npm run allure:generate` |
| **Open Allure report** | `npm run allure:open` |
| **Generate + open Allure report** | `npm run allure:report` |

> **`allure:*` scripts** use `npx allure-commandline` and need a **JDK** on your PATH (`java -version`). After `npm run allure:generate`, **do not open `allure-report/index.html` via `file://`** in the browser — Chrome blocks the report’s requests to local JSON files, so widgets stay on **“Loading…”**. Use **`npm run allure:open`** instead; it serves the folder over **http://localhost** and the dashboard loads correctly.

---

## Tags (filter runs)

Each Playwright `test.describe` sets [`tag`](https://playwright.dev/docs/test-annotations#tag-tests) values (always `@…`). Tags appear in the HTML report and are matched by **`--grep`** / **`--grep-invert`**.

| Tag | Meaning |
|-----|---------|
| `@api` | HTTP-only checks under `tests/api/` (uses `request`, no browser UI for that file’s primary flow). |
| `@ui` | Browser specs under `tests/ui/` (uses `page`). |
| `@contract` | API contract suite — `books-api.spec.ts`. |
| `@boundary` | API boundary / coercion — `books-api.spec.ts` and `books-api-path-hygiene.spec.ts`. |
| `@regression` | Known-bug regression checks — `book-library.spec.ts` (`Error-state regression`) — `test.fail()` until fixed. |
| `@security` | SQL-shaped literal persistence (`books-api-injection-literals.spec.ts`) **or** UI stored-markup checks (`stored-markup-injection.spec.ts`). |
| `@repeat` | Sequential repeated `POST` creates. |
| `@smoke` | Short core library UI journey — `book-library.spec.ts` (`Home + book detail routing`). |
| `@responsive` | Mobile viewport layout smoke — describe blocks co-located in `book-library.spec.ts` (home + detail) and `add-book.spec.ts` (form). Run by `mobile-chrome` / `mobile-safari` projects only. |
| `@add-book` | Add-book form suite — `add-book.spec.ts` and `add-book-validation-bugs.spec.ts`; many scenarios use `test.fail()` until bugs are fixed. |
| `@bug` | Input-validation bug regressions — `add-book-validation-bugs.spec.ts`. All `test.fail()` until corresponding bugs are resolved. **Also** accessibility axe tests that wrap open **BUG-015** (`axe-wcag-aa-smoke.spec.ts`). |
| `@integration` | After API create: catalog JSON check **and/or** UI home + detail check — `books-api-create-verify-on-ui.spec.ts`. |
| `@accessibility` | axe WCAG AA smoke — `tests/accessibility/axe-wcag-aa-smoke.spec.ts` (merge gate: serious/critical). |

**Examples**

```bash
# Only API project-style files (grep matches tagged tests; combine with --project if desired)
npx playwright test --grep @api

# Smoke UI + full contract in one run (OR logic: run twice or use grep regex)
npx playwright test --grep "@smoke|@contract"
```

**Note:** In `playwright.config.ts`, the **`api` project** runs both `tests/api/**` and `tests/integration/**` with one worker/browser context (integration’s UI test uses `page` there). Tags like `@api` are for **filtering** (`--grep`); they do not switch projects. For a fast HTTP-only run: `npx playwright test --project=api`.

---

## Application server and E2E

`playwright.config.ts` defines a **`webServer`** that runs `npm run dev` when tests start (unless `CI` is set in a way that disables reuse — see your config).

- **Typical local flow:** You can leave `npm run dev` running; Playwright often **reuses** the existing server (`reuseExistingServer`) so tests attach to `http://localhost:3000`.  
- **Clean run:** Stop any dev server, then run `npm run test:e2e` so Playwright starts its own instance.

---

## Reports and debugging

| Output | How |
|--------|-----|
| **Playwright HTML report** | After a run: `npx playwright show-report` (default folder: `playwright-report/`) |
| **Traces** | **All projects:** `playwright.config.ts` sets `use.trace: 'retain-on-failure'` — every **final** failure (after retries in CI) keeps a `trace.zip` under `test-results/` with timeline, network, and (for UI tests) screenshots. Open from the HTML report or `npx playwright show-trace path/to/trace.zip`. |
| **Axe (accessibility)** | Routes affected by **BUG-015** use **`test.fail()`**: assertion expects zero serious/critical violations; while the bug is open the assertion fails and Playwright counts an **expected failure** (CI stays green). Evidence is always in **attachments** (`axe-*-violations.json`). Remove `test.fail()` when the product is fixed. **Add book** is a normal strict check. |
| **Screenshots / video** | Captured `only-on-failure` / `on-first-retry` — visible in the HTML report |
| **Vitest terminal** | Default reporter; use `npx vitest --reporter=verbose` for more detail |
| **Coverage (HTML)** | After `npm run test:coverage`: open `coverage/index.html` |
| **Allure (unified)** | Both Vitest and Playwright write to `allure-results/`; run `npm run allure:report` to generate and open a combined HTML report |

### API observability (`BooksApiClient`)

Playwright’s **`APIRequestContext`** does not log response bodies by default. This repo follows a common split: **traces + report attachments** by default policy, **console** only when you ask.

| Mechanism | When | What you get |
|-----------|------|----------------|
| **Trace (any project)** | Any **failed** Playwright test (after retries) | Zip under `test-results/` — `playwright.config.ts` → global `trace: 'retain-on-failure'`. |
| **Attachment `api-http-transcript.json`** | Failed test, or **any** outcome if `PLAYWRIGHT_ATTACH_API=1` | Ordered list of every `booksApiClient` call: method, path, status, response URL, body (large bodies truncated per call for report size). Shown in **HTML report** and **Allure**. |
| **`PW_DEBUG_API=1`** | You set the env var | Same bodies **pretty-printed to stdout** for local debugging. |

Calls that bypass `booksApiClient` (e.g. raw `request.post` in the malformed-JSON test) are **not** in the transcript.

**PowerShell — console debug**

```powershell
$env:PW_DEBUG_API = '1'
npx playwright test tests/api/books-api.spec.ts --project=api --workers=1
Remove-Item Env:PW_DEBUG_API
```

**bash — console debug**

```bash
PW_DEBUG_API=1 npx playwright test tests/api/books-api.spec.ts --project=api --workers=1
```

**Attach transcript even when the test passed** (e.g. deep local investigation):

```powershell
$env:PLAYWRIGHT_ATTACH_API = '1'
npx playwright test tests/api/books-api.spec.ts --project=api
Remove-Item Env:PLAYWRIGHT_ATTACH_API
```

Use **`--workers=1`** when reading stdout so parallel tests do not interleave.

---

## What we test (summary)

Aligned with [TEST_PLAN.md](./TEST_PLAN.md):

- **UI:** Home library list, navigation to book detail, add-book flow, error/retry where automated.  
- **API:** `GET /api/books`, `GET /api/books/[id]`, `POST /api/books` — status codes and response shape.  
- **Security:** `@security`-tagged API literal probe + stored-markup UI smoke (see **Security testing — scope and rules** above). Path/hygiene checks live under `tests/api/` with `@boundary`.  
- **Accessibility:** `@accessibility` axe suite in `tests/accessibility/` — **`test.fail()`** for **BUG-015** on home/detail; see **Reports** and [BUGS_FOUND.md](./BUGS_FOUND.md).  
- **Known issues:** Some scenarios match open defects in [BUGS_FOUND.md](./BUGS_FOUND.md); tests may assert current behaviour until fixes land.

---

## CI — Azure DevOps

The repo ships with `azure-pipelines.yml` which defines a **three-stage pipeline**:

| Stage | What it does |
|-------|-------------|
| **Lint & Unit Tests** | Installs deps, runs ESLint, runs Vitest with coverage, publishes JUnit + LCOV results to Azure, uploads `allure-results` artifact |
| **E2E Tests** | Installs Playwright browsers (`--with-deps`), builds the app, runs all Playwright projects, publishes JUnit + HTML report, uploads **`test-results/`** (includes **trace `*.zip` on failure** — see `variables` / `env` comments in `azure-pipelines.yml` and `use.trace` in `playwright.config.ts`), uploads `allure-results` artifact |
| **Allure Report** | Downloads both `allure-results` artifacts, merges them, generates a unified Allure HTML report, uploads as a pipeline artifact |

**Key environment behaviour controlled by `CI=true`:**
- `forbidOnly` — fails the run if any `.only` is left in a spec
- `retries: 2` — flaky tests get two retries before failing
- `workers: 2` — parallelism capped to avoid resource contention on hosted agents
- Playwright reporters switch to `junit` + `allure-playwright` (no interactive HTML needed in CI)

**To connect the pipeline in Azure DevOps:**
1. Push `azure-pipelines.yml` to your repo
2. In Azure DevOps → **Pipelines** → **New Pipeline** → select your repo → **Existing Azure Pipelines YAML file**
3. Point to `azure-pipelines.yml` at the repo root

**Local simulation of CI behaviour:**
```bash
CI=true npx vitest run
CI=true npm run test:e2e
```

---

## Troubleshooting

| Problem | Suggestion |
|---------|------------|
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install` |
| E2E times out waiting for URL | Ensure port **3000** is free or adjust `baseURL` / `webServer` in config |
| Tests pass locally but fail in CI | Run `npx vitest run` and `npm run test:e2e` with `CI=true` locally |

---

## Related docs

- [README.md](./README.md) — App setup and API overview  
- [TEST_PLAN.md](./TEST_PLAN.md) — Scope, cases, traceability  

- [BUGS_FOUND.md](./BUGS_FOUND.md) — Defect log  

