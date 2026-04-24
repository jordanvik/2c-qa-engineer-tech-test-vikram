import { defineConfig, devices } from '@playwright/test';


//  Project scoping strategy:
//  api          — `tests/api/**` + `tests/integration/**` (HTTP via `request`; integration UI test also uses `page`)
// chromium     — UI, security, and accessibility (axe) specs. Excludes @responsive (needs specific mobile viewport).
// firefox      — Same subset as chromium.
// webkit       — Same as firefox.
// mobile-chrome / mobile-safari — @responsive tagged tests only, matched across UI + security + accessibility specs.
// Spec files are grouped by feature concern under tests/.

const API_SPECS = [
  '**/api/**/*.spec.ts',
  '**/integration/**/*.spec.ts',
];

const UI_SPECS_DESKTOP = [
  '**/ui/**/*.spec.ts',
  '**/security/**/*.spec.ts',
  '**/accessibility/**/*.spec.ts',
];

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**', '**/support/**'],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cap workers locally so a single `next dev` instance is not overwhelmed (avoids stuck "Loading books…" / failed GETs).
  workers: process.env.CI ? 2 : 4,

  reporter: process.env.CI
    ? [['junit', { outputFile: 'test-results/results.xml' }], ['allure-playwright'], ['list']]
    : [['html'], ['allure-playwright'], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    // CI YAML publishes `test-results/` — retain trace zips on every final failure (see TESTING.md).
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // API-only: request context, one browser is sufficient
    {
      name: 'api',
      testMatch: API_SPECS,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Desktop UI: all three browsers
    {
      name: 'chromium',
      testMatch: UI_SPECS_DESKTOP,
      grepInvert: /@responsive/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: UI_SPECS_DESKTOP,
      grepInvert: /@responsive/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: UI_SPECS_DESKTOP,
      grepInvert: /@responsive/,
      use: { ...devices['Desktop Safari'] },
    },

    // Responsive: mobile viewports only — picks up @responsive describes in any UI spec
    {
      name: 'mobile-chrome',
      testMatch: UI_SPECS_DESKTOP,
      grep: /@responsive/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      testMatch: UI_SPECS_DESKTOP,
      grep: /@responsive/,
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
