# QA tech test — testing approach

This file satisfies the **“document your approach in a separate markdown file”** item in `TECH_TEST_GUIDE.md`. Detailed matrices, tags, and defect IDs live in the linked documents below.

## Strategy (high level)

1. **End-to-end first for product truth** — Playwright exercises real HTTP, Next.js routing, and the in-memory API together (`tests/ui/`, `tests/integration/`, `tests/security/`, `tests/accessibility/`).
2. **Fast feedback with Vitest** — Same screens and `books-data` helpers are covered with mocked `fetch` under `tests/unit/` for render and error-path regressions without a browser.
3. **Contract and abuse paths** — Dedicated API specs (`tests/api/`) document status codes, boundary payloads, and injection-shaped literals.
4. **Accessibility as evidence** — axe runs attach JSON on failure; known contrast gaps stay `test.fail()` until product changes (see `BUGS_FOUND.md` **BUG-015**).
5. **Defects drive traceability** — Each significant gap has a **BUG-xxx** id, linked from `TEST_PLAN.md` and mirrored in automation annotations.

## Where to read more

| Document | Purpose |
|----------|---------|
| [TEST_PLAN.md](./TEST_PLAN.md) | Formal TC matrices, automation map (§11), bug automation audit (§12a). |
| [TESTING.md](./TESTING.md) | How to run and filter Playwright/Vitest, tags, traces, Allure, CI notes. |
| [BUGS_FOUND.md](./BUGS_FOUND.md) | Defect log: severity, repro, code refs, manual quick matrix. |
| [README.md](./README.md) | Install, scripts table, layout of `tests/` folders. |

## How to run the suite locally

```bash
npm install
npm run test -- --run              # Vitest (unit), once
npm run test:e2e                   # Playwright — all projects (needs dev server; Playwright starts it via webServer)
npm run test:coverage              # Optional — Vitest coverage (HTML under coverage/)
```

Scoped examples (see `TESTING.md` for full list):

```bash
npx vitest run tests/unit
npx playwright test tests/api --project=api
npx playwright test tests/ui --project=chromium
```

## Test reports for submission

Generated reports are **not committed** (they are large and machine-specific); `.gitignore` excludes `playwright-report/`, `test-results/`, `allure-results/`, `allure-report/`, `coverage/`.

**Attach to the PR (recommended):** two zips from a single local run — **`playwright-report.zip`** (contents of `playwright-report/`) and **`allure-report.zip`** (contents of **`allure-report/`**, i.e. the **generated HTML** after `allure:generate`, not raw `allure-results/`). In the PR description, note the **commit hash** and **date** of the run.

### How reviewers should open the Playwright report

1. Unzip `playwright-report.zip` to a folder (e.g. `playwright-report/`).
2. From any machine with Node/npm, run:
   ```bash
   npx playwright show-report path/to/playwright-report
   ```
   Playwright serves the report over **http://localhost** and opens the browser. (Opening `index.html` via `file://` is unreliable for this report too — use the command above.)

### How reviewers should open the Allure report

Allure’s UI loads JSON from the `data/` folder. Browsers **block** that when you open **`index.html` with `file://`**, so widgets stay on **“Loading…”**. After unzipping **`allure-report.zip`**:

**Option A — no Java required**

```bash
cd path/to/allure-report
npx --yes serve .
```

Open the **`http://localhost:…`** URL printed in the terminal. Press **Ctrl+C** when finished.

**Option B — Allure CLI (needs a JDK on PATH and `JAVA_HOME` if your shell does not see `java`)**

```bash
npx --yes allure-commandline open path/to/allure-report
```

### How candidates produce those zips

```bash
npm install
npm run test -- --run          # Vitest → contributes to allure-results
npm run test:e2e               # Playwright → playwright-report/ + allure-results
npm run allure:generate        # JDK required; writes allure-report/ (see TESTING.md)
```

Then zip **`playwright-report/`** and **`allure-report/`** separately and attach both to the PR. More detail: [TESTING.md](./TESTING.md) (commands, `file://` caveat, Java/PATH).

### Vitest coverage (optional)

```bash
npm run test:coverage
```

Zip **`coverage/`** only if you want coverage in the submission package; open `coverage/index.html` via a local server if double-click fails.

## CI

`azure-pipelines.yml` runs lint, unit tests with coverage, Playwright E2E, and can publish trace/HTML artifacts — useful if reviewers prefer pipeline evidence over a local zip.

## Fork and pull request

Per `TECH_TEST_GUIDE.md`: work lives in a **private fork**, hiring manager added as **collaborator**, changes proposed via **pull request** (e.g. from `feat/qa-book-library` into `main` on the fork). This repo is forked from the upstream tech-test template; push your branch, then use GitHub **“Compare & pull request”** when prompted after a push.

---

**Summary for reviewers:** automation layout → `README.md` table; planned coverage and defect traceability → `TEST_PLAN.md` + `BUGS_FOUND.md`; execution and reporting details → `TESTING.md` + this file. PR attachments: **Playwright** + **Allure** HTML zips as above; use **`npx playwright show-report`** and **`npx serve`** (or Allure `open`) so reports load over **http://**, not `file://`. Optional **coverage** zip.
