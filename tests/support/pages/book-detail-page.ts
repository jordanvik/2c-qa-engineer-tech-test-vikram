import type { Locator } from '@playwright/test';
import { BasePage } from './base-page';

// `/book/[id]` — single book detail view. No assertions here.

export class BookDetailsPage extends BasePage {
  titleHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  titleHeadingNamed(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }

  authorLine(author: string): Locator {
    return this.page.getByText(`by ${author}`);
  }

  // The "(X/5)" rating label rendered on the detail page.
  ratingText(): Locator {
    return this.page.getByText(/\(.*\/5\)/);
  }

  // Error / empty states surface copy matching these patterns.
  errorOrNotFoundMessage(): Locator {
    return this.page.getByText(/Book not found|Failed to fetch book|Error/i).first();
  }

  async openById(id: number): Promise<void> {
    await this.navigate(`/book/${id}`);
  }

  async backToLibrary(): Promise<void> {
    // Success layout has two "Back to Library" links (header + footer). Prefer the footer
    // action row so we do not depend on DOM order across browsers / hydration.
    const footerBack = this.page
      .locator('div.mt-8.flex')
      .filter({ has: this.page.getByRole('link', { name: /Add Another Book/i }) })
      .getByRole('link', { name: /Back to Library/i });
    if (await footerBack.isVisible().catch(() => false)) {
      await footerBack.click();
      return;
    }
    await this.page.getByRole('link', { name: /Back to Library/i }).first().click();
  }
}
