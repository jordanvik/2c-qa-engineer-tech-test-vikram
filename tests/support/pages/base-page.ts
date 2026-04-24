import type { Page } from '@playwright/test';

// Shared navigation for all page objects under the Book Library app.

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
